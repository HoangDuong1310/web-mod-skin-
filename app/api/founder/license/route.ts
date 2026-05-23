/**
 * API Route: /api/founder/license
 * Generate and serve a signed Founder license file for the authenticated user.
 * 
 * Method: GET
 * Auth: Required (user must be logged in AND marked as isFounder)
 * 
 * Returns: JSON file containing { payload, signature } that the Ainz client
 * can verify offline using the embedded Ed25519 public key.
 * 
 * Environment variable required:
 *   FOUNDER_PRIVATE_KEY - Base64-encoded Ed25519 private key (32 bytes raw seed)
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// Perks granted per tier (must match auth/core/founder.py constants)
const TIER_PERKS: Record<string, string[]> = {
  BASIC: ['badge', 'theme', 'exclusive_buttons'],
  PRO: ['badge', 'theme', 'exclusive_buttons', 'early_update', 'no_rate_limit'],
  LIFETIME: ['badge', 'theme', 'exclusive_buttons', 'early_update', 'no_rate_limit'],
}

/**
 * Produce canonical JSON matching Python's:
 *   json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
 *
 * - Recursively sorts object keys
 * - Uses compact separators (no spaces)
 * - Preserves array order
 * - All payload fields should be ASCII to avoid escaping mismatch
 */
function canonicalJson(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null'
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalJson).join(',') + ']'
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const sortedKeys = Object.keys(obj).sort()
    const parts = sortedKeys.map(
      (k) => JSON.stringify(k) + ':' + canonicalJson(obj[k])
    )
    return '{' + parts.join(',') + '}'
  }
  return JSON.stringify(value)
}

/**
 * Sign a raw message with an Ed25519 private key (32-byte seed in base64).
 * Node's crypto API needs the seed wrapped in a PKCS8 DER envelope.
 */
function signEd25519(message: Buffer, privateKeyB64: string): Buffer {
  const seed = Buffer.from(privateKeyB64, 'base64')
  if (seed.length !== 32) {
    throw new Error(`Expected 32-byte Ed25519 seed, got ${seed.length} bytes`)
  }
  // PKCS8 prefix for Ed25519 (OID 1.3.101.112): wraps 32-byte seed → 48-byte DER
  const pkcs8Prefix = Buffer.from('302e020100300506032b657004220420', 'hex')
  const pkcs8Der = Buffer.concat([pkcs8Prefix, seed])
  const privateKey = crypto.createPrivateKey({
    key: pkcs8Der,
    format: 'der',
    type: 'pkcs8',
  })
  return crypto.sign(null, message, privateKey)
}

export async function GET() {
  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập để tải Founder License' },
        { status: 401 }
      )
    }

    // 2. Check if user is a Founder
    // Note: cast to any until `prisma generate` is run after the migration
    const user = (await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        isFounder: true,
        founderSince: true,
        founderTier: true,
      } as any,
    })) as null | {
      id: string
      email: string
      isFounder: boolean
      founderSince: Date | null
      founderTier: string | null
    }

    if (!user || !user.isFounder) {
      return NextResponse.json(
        { error: 'NOT_FOUNDER', message: 'Tài khoản này không phải Founder' },
        { status: 403 }
      )
    }

    // 3. Check private key is configured
    const privateKeyB64 = process.env.FOUNDER_PRIVATE_KEY
    if (!privateKeyB64) {
      console.error('FOUNDER_PRIVATE_KEY environment variable not set')
      return NextResponse.json(
        { error: 'SERVER_CONFIG', message: 'Hệ thống chưa được cấu hình. Liên hệ admin.' },
        { status: 500 }
      )
    }

    // 4. Build the license payload (all fields ASCII to avoid encoding mismatch)
    const tier = user.founderTier || 'BASIC'
    const perks = TIER_PERKS[tier] || TIER_PERKS.BASIC

    const payload = {
      version: 1,
      user_id: user.id,
      email: user.email,
      tier: tier,
      founder_since: user.founderSince
        ? user.founderSince.toISOString()
        : new Date().toISOString(),
      issued_at: new Date().toISOString(),
      perks: perks,
    }

    // 5. Sign the canonical payload with Ed25519
    const message = Buffer.from(canonicalJson(payload), 'utf-8')
    let signatureB64: string
    try {
      signatureB64 = signEd25519(message, privateKeyB64).toString('base64')
    } catch (err) {
      console.error('Ed25519 signing failed:', err)
      return NextResponse.json(
        { error: 'SIGN_ERROR', message: 'Không thể ký license file' },
        { status: 500 }
      )
    }

    // 6. Return as downloadable JSON
    const licenseFile = { payload, signature: signatureB64 }
    return new NextResponse(JSON.stringify(licenseFile, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="founder_license.json"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Founder license generation error:', error)
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Lỗi tạo license file' },
      { status: 500 }
    )
  }
}

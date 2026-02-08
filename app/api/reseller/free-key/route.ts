/**
 * API Route: /api/reseller/free-key
 * API lấy free key cho reseller
 * Reseller xác thực bằng API key trong header: Authorization: Bearer rsk_xxx
 * 
 * Method: POST - Generate a free key
 * Method: GET  - Check quota status
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateReseller, updateApiKeyLastUsed, checkFreeKeyQuota, generateResellerFreeKey } from '@/lib/reseller'

/**
 * Extract API key from Authorization header
 */
function getApiKeyFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null

  // Support both "Bearer rsk_xxx" and "rsk_xxx"
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  if (authHeader.startsWith('rsk_')) {
    return authHeader
  }

  return null
}

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
}

/**
 * POST /api/reseller/free-key
 * Generate a free license key
 * 
 * Headers:
 *   Authorization: Bearer rsk_xxxxx
 * 
 * Body (optional):
 *   { "quantity": 1 }  // Default: 1, max configurable by admin
 * 
 * Response:
 *   { success: true, keys: [...], quota: {...} }
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = getApiKeyFromRequest(request)
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'MISSING_API_KEY', message: 'API key is required. Use Authorization header.' },
        { status: 401 }
      )
    }

    // Authenticate
    const reseller = await authenticateReseller(apiKey)
    if (!reseller) {
      return NextResponse.json(
        { success: false, error: 'INVALID_API_KEY', message: 'Invalid or expired API key' },
        { status: 401 }
      )
    }

    // Update last used IP
    const clientIp = getClientIp(request)
    await updateApiKeyLastUsed(apiKey, clientIp)

    // Parse body for quantity
    let quantity = 1
    try {
      const body = await request.json()
      if (body.quantity && typeof body.quantity === 'number') {
        quantity = Math.min(Math.max(1, Math.floor(body.quantity)), 50) // Max 50 per request
      }
    } catch {
      // No body or invalid JSON - use default quantity of 1
    }

    // Generate keys
    const keys: Array<{
      key: string
      expiresAt: Date | null
      maxDevices: number
      plan: { name: string; durationType: string; durationValue: number }
    }> = []

    const errors: string[] = []

    for (let i = 0; i < quantity; i++) {
      try {
        const result = await generateResellerFreeKey(reseller.id)
        keys.push(result)
      } catch (error: any) {
        errors.push(error.message)
        break // Stop on first error (likely quota exceeded)
      }
    }

    if (keys.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'GENERATION_FAILED',
          message: errors[0] || 'Failed to generate keys',
        },
        { status: 400 }
      )
    }

    // Get updated quota
    const quotaStatus = await checkFreeKeyQuota(reseller.id)

    return NextResponse.json({
      success: true,
      keys: keys.map(k => ({
        key: k.key,
        expiresAt: k.expiresAt,
        maxDevices: k.maxDevices,
        plan: k.plan,
      })),
      generated: keys.length,
      requested: quantity,
      quota: quotaStatus.remaining,
      ...(errors.length > 0 ? { warnings: errors } : {}),
    })
  } catch (error) {
    console.error('Reseller free-key POST error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/reseller/free-key
 * Check free key quota status
 * 
 * Headers:
 *   Authorization: Bearer rsk_xxxxx
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = getApiKeyFromRequest(request)
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'MISSING_API_KEY', message: 'API key is required' },
        { status: 401 }
      )
    }

    const reseller = await authenticateReseller(apiKey)
    if (!reseller) {
      return NextResponse.json(
        { success: false, error: 'INVALID_API_KEY', message: 'Invalid or expired API key' },
        { status: 401 }
      )
    }

    const quotaStatus = await checkFreeKeyQuota(reseller.id)

    return NextResponse.json({
      success: true,
      reseller: {
        businessName: reseller.businessName,
        status: reseller.status,
      },
      quota: quotaStatus,
      freeKeyPlan: reseller.freeKeyPlan
        ? {
            name: reseller.freeKeyPlan.name,
            durationType: reseller.freeKeyPlan.durationType,
            durationValue: reseller.freeKeyPlan.durationValue,
          }
        : null,
    })
  } catch (error) {
    console.error('Reseller free-key GET error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * API Route: /api/reseller/keys
 * Reseller key management - list & purchase keys
 * 
 * Method: GET  - List allocated keys
 * Method: POST - Purchase keys
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateReseller, updateApiKeyLastUsed, purchaseResellerKeys } from '@/lib/reseller'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

function getApiKeyFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7)
  if (authHeader.startsWith('rsk_')) return authHeader
  return null
}

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
}

/**
 * GET /api/reseller/keys
 * List allocated keys with filtering & pagination
 * 
 * Query params:
 *   page (default: 1)
 *   limit (default: 20, max: 100)
 *   type (PURCHASED | FREE)
 *   status (ACTIVE | INACTIVE | EXPIRED)
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

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const type = searchParams.get('type') as 'PURCHASED' | 'FREE' | null
    const keyStatus = searchParams.get('status')

    // Build where clause
    const where: any = {
      resellerId: reseller.id,
    }

    if (type) {
      where.type = type
    }

    if (keyStatus) {
      where.licenseKey = {
        status: keyStatus,
      }
    }

    const [allocations, total] = await Promise.all([
      prisma.resellerKeyAllocation.findMany({
        where,
        include: {
          licenseKey: {
            select: {
              key: true,
              status: true,
              expiresAt: true,
              activatedAt: true,
              maxDevices: true,
              currentDevices: true,
              plan: {
                select: {
                  name: true,
                  durationType: true,
                  durationValue: true,
                },
              },
            },
          },
        },
        orderBy: { allocatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.resellerKeyAllocation.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      keys: allocations.map((a: any) => ({
        id: a.id,
        type: a.type,
        allocatedAt: a.allocatedAt,
        key: a.licenseKey.key,
        status: a.licenseKey.status,
        expiresAt: a.licenseKey.expiresAt,
        activatedAt: a.licenseKey.activatedAt,
        maxDevices: a.licenseKey.maxDevices,
        currentDevices: a.licenseKey.currentDevices,
        plan: a.licenseKey.plan,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Reseller keys GET error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}

const purchaseSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  quantity: z.number().int().min(1).max(500),
})

/**
 * POST /api/reseller/keys
 * Purchase license keys
 * 
 * Body:
 *   { planId: string, quantity: number }
 * 
 * Deducts from reseller balance, applies discount
 */
export async function POST(request: NextRequest) {
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

    const clientIp = getClientIp(request)
    await updateApiKeyLastUsed(apiKey, clientIp)

    const body = await request.json()
    const validated = purchaseSchema.parse(body)

    const result = await purchaseResellerKeys({
      resellerId: reseller.id,
      planId: validated.planId,
      quantity: validated.quantity,
    })

    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${result.quantity} keys`,
      ...result,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', details: error.errors },
        { status: 400 }
      )
    }

    if (error.message?.includes('Insufficient balance') ||
        error.message?.includes('Plan not found') ||
        error.message?.includes('not approved') ||
        error.message?.includes('Maximum')) {
      return NextResponse.json(
        { success: false, error: 'BUSINESS_ERROR', message: error.message },
        { status: 400 }
      )
    }

    console.error('Reseller keys POST error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}

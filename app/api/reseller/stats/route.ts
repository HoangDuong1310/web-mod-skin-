/**
 * API Route: /api/reseller/stats
 * Thống kê reseller
 * Method: GET
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateReseller, getResellerStats } from '@/lib/reseller'

function getApiKeyFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7)
  if (authHeader.startsWith('rsk_')) return authHeader
  return null
}

/**
 * GET /api/reseller/stats
 * Get reseller statistics
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

    const stats = await getResellerStats(reseller.id)

    return NextResponse.json({
      success: true,
      reseller: {
        businessName: reseller.businessName,
        status: reseller.status,
      },
      stats,
    })
  } catch (error) {
    console.error('Reseller stats GET error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}

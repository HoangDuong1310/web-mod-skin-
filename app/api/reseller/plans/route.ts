/**
 * API Route: /api/reseller/plans
 * List available plans for reseller to purchase
 * Method: GET
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateReseller } from '@/lib/reseller'
import { prisma } from '@/lib/prisma'

function getApiKeyFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7)
  if (authHeader.startsWith('rsk_')) return authHeader
  return null
}

/**
 * GET /api/reseller/plans
 * List available subscription plans with reseller pricing
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

    // Get active plans
    const plans = await prisma.subscriptionPlan.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        nameEn: true,
        slug: true,
        description: true,
        price: true,
        currency: true,
        durationType: true,
        durationValue: true,
        maxDevices: true,
        features: true,
      },
      orderBy: [
        { priority: 'desc' },
        { price: 'asc' },
      ],
    })

    // Get reseller discount info
    const resellerData = await prisma.reseller.findUnique({
      where: { id: reseller.id },
      select: {
        discountPercent: true,
        currency: true,
      },
    })

    const discountPercent = resellerData?.discountPercent || 0

    return NextResponse.json({
      success: true,
      discountPercent,
      plans: plans.map(plan => {
        const originalPrice = Number(plan.price)
        const discountedPrice = originalPrice * (1 - discountPercent / 100)

        return {
          id: plan.id,
          name: plan.name,
          nameEn: plan.nameEn,
          slug: plan.slug,
          description: plan.description,
          originalPrice,
          resellerPrice: Math.round(discountedPrice),
          currency: plan.currency,
          durationType: plan.durationType,
          durationValue: plan.durationValue,
          maxDevices: plan.maxDevices,
          features: plan.features ? JSON.parse(plan.features) : [],
        }
      }),
    })
  } catch (error) {
    console.error('Reseller plans GET error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}

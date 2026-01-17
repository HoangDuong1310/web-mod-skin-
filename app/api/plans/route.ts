/**
 * API Route: /api/plans
 * Lấy danh sách gói cước (Public)
 * Method: GET
 * 
 * Query params:
 * - currency: VND | USD (auto-detect from IP if not provided)
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { getCountryFromHeaders, getCurrencyForCountry, transformPlanForCurrency } from '@/lib/geo'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requestedCurrency = searchParams.get('currency')?.toUpperCase() as 'VND' | 'USD' | null
    
    // Detect country from headers
    const headersList = headers()
    const countryCode = getCountryFromHeaders(headersList)
    
    // Use requested currency or auto-detect
    const currency = requestedCurrency || getCurrencyForCountry(countryCode)
    
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
        descriptionEn: true,
        price: true,
        comparePrice: true,
        currency: true,
        priceUsd: true,
        comparePriceUsd: true,
        durationType: true,
        durationValue: true,
        features: true,
        featuresEn: true,
        maxDevices: true,
        isPopular: true,
        isFeatured: true,
        color: true,
      },
      orderBy: [
        { priority: 'desc' },
        { price: 'asc' },
      ],
    })
    
    // Transform plans based on currency
    const transformedPlans = plans.map(plan => transformPlanForCurrency(plan, currency))
    
    return NextResponse.json({
      success: true,
      data: transformedPlans,
      meta: {
        currency,
        countryCode,
        locale: currency === 'USD' ? 'en' : 'vi',
      },
    })
  } catch (error) {
    console.error('Get plans error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}

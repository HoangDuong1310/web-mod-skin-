/**
 * API Route: /api/admin/plans
 * Quản lý subscription plans (Admin only)
 * Methods: GET, POST
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Lấy tất cả plans (bao gồm cả inactive)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'STAFF'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const includeDeleted = searchParams.get('includeDeleted') === 'true'
    
    const where: any = {}
    if (!includeDeleted) {
      where.deletedAt = null
    }
    
    const plans = await prisma.subscriptionPlan.findMany({
      where,
      include: {
        _count: {
          select: {
            licenseKeys: true,
            orders: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    })
    
    return NextResponse.json({
      success: true,
      data: plans,
    })
  } catch (error) {
    console.error('Get plans error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}

// POST - Tạo plan mới
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const {
      name,
      nameEn,
      slug,
      description,
      descriptionEn,
      price,
      comparePrice,
      priceUsd,
      comparePriceUsd,
      currency,
      durationType,
      durationValue,
      features,
      featuresEn,
      maxDevices,
      isActive,
      isPopular,
      isFeatured,
      priority,
      color,
    } = body
    
    // Validate required fields
    if (!name || !slug || price === undefined || !durationType) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS', message: 'Vui lòng điền đầy đủ thông tin' },
        { status: 400 }
      )
    }
    
    // Check slug unique
    const existing = await prisma.subscriptionPlan.findUnique({
      where: { slug },
    })
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'SLUG_EXISTS', message: 'Slug đã tồn tại' },
        { status: 400 }
      )
    }
    
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        nameEn,
        slug,
        description,
        descriptionEn,
        price,
        comparePrice,
        priceUsd,
        comparePriceUsd,
        currency: currency || 'VND',
        durationType,
        durationValue: durationValue || 1,
        features: features ? JSON.stringify(features) : null,
        featuresEn: featuresEn ? JSON.stringify(featuresEn) : null,
        maxDevices: maxDevices || 1,
        isActive: isActive !== false,
        isPopular: isPopular || false,
        isFeatured: isFeatured || false,
        priority: priority || 0,
        color,
      },
    })
    
    return NextResponse.json({
      success: true,
      message: 'Đã tạo gói cước',
      data: plan,
    })
  } catch (error) {
    console.error('Create plan error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * API Route: /api/admin/plans/[id]
 * Quản lý subscription plan cụ thể
 * Methods: GET, PATCH, DELETE
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface RouteParams {
  params: { id: string }
}

// GET - Chi tiết plan
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'STAFF'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            licenseKeys: true,
            orders: true,
          },
        },
      },
    })
    
    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: plan,
    })
  } catch (error) {
    console.error('Get plan error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}

// PATCH - Cập nhật plan
export async function PATCH(request: Request, { params }: RouteParams) {
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
    
    // Check if plan exists
    const existing = await prisma.subscriptionPlan.findUnique({
      where: { id: params.id },
    })
    
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND' },
        { status: 404 }
      )
    }
    
    // Check slug unique if changed
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.subscriptionPlan.findFirst({
        where: { slug, id: { not: params.id } },
      })
      
      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'SLUG_EXISTS', message: 'Slug đã tồn tại' },
          { status: 400 }
        )
      }
    }
    
    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name
    if (nameEn !== undefined) updateData.nameEn = nameEn
    if (slug !== undefined) updateData.slug = slug
    if (description !== undefined) updateData.description = description
    if (descriptionEn !== undefined) updateData.descriptionEn = descriptionEn
    if (price !== undefined) updateData.price = price
    if (comparePrice !== undefined) updateData.comparePrice = comparePrice
    if (priceUsd !== undefined) updateData.priceUsd = priceUsd
    if (comparePriceUsd !== undefined) updateData.comparePriceUsd = comparePriceUsd
    if (currency !== undefined) updateData.currency = currency
    if (durationType !== undefined) updateData.durationType = durationType
    if (durationValue !== undefined) updateData.durationValue = durationValue
    if (features !== undefined) updateData.features = features ? JSON.stringify(features) : null
    if (featuresEn !== undefined) updateData.featuresEn = featuresEn ? JSON.stringify(featuresEn) : null
    if (maxDevices !== undefined) updateData.maxDevices = maxDevices
    if (isActive !== undefined) updateData.isActive = isActive
    if (isPopular !== undefined) updateData.isPopular = isPopular
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured
    if (priority !== undefined) updateData.priority = priority
    if (color !== undefined) updateData.color = color
    
    const plan = await prisma.subscriptionPlan.update({
      where: { id: params.id },
      data: updateData,
    })
    
    return NextResponse.json({
      success: true,
      message: 'Đã cập nhật gói cước',
      data: plan,
    })
  } catch (error) {
    console.error('Update plan error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete plan
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Luôn soft delete: cập nhật deletedAt và isActive
    await prisma.subscriptionPlan.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Đã ẩn gói cước',
    })
  } catch (error) {
    console.error('Delete plan error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}

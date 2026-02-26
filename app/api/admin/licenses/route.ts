/**
 * API Route: /api/admin/licenses
 * Quản lý license keys (Admin only)
 * Methods: GET, POST
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createLicenseKey, createMultipleLicenseKeys } from '@/lib/license-key'
import { emailService } from '@/lib/email'

// GET - Lấy danh sách licenses
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'STAFF'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Tự động cập nhật các keys đã hết hạn nhưng status vẫn là ACTIVE
    const now = new Date(Date.now())
    const updateResult = await prisma.licenseKey.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          lt: now
        }
      },
      data: {
        status: 'EXPIRED'
      }
    })

    if (updateResult.count > 0) {
      console.log(`[License Cron] Updated ${updateResult.count} expired keys`)
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const planId = searchParams.get('planId')
    const search = searchParams.get('search')
    const userId = searchParams.get('userId')
    
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (planId) {
      where.planId = planId
    }
    
    if (userId) {
      where.userId = userId
    }
    
    if (search) {
      where.OR = [
        { key: { contains: search } },
        { user: { email: { contains: search } } },
        { user: { name: { contains: search } } },
        { notes: { contains: search } },
      ]
    }
    
    const [licenses, total] = await Promise.all([
      prisma.licenseKey.findMany({
        where,
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              durationType: true,
              durationValue: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              activations: { where: { status: 'ACTIVE' } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.licenseKey.count({ where }),
    ])
    
    return NextResponse.json({
      success: true,
      data: {
        licenses,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Get licenses error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}

// POST - Tạo license key mới
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'STAFF'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { planId, userId, notes, count } = body
    
    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'MISSING_PLAN', message: 'Vui lòng chọn gói cước' },
        { status: 400 }
      )
    }
    
    // Verify plan exists
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    })
    
    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'INVALID_PLAN', message: 'Gói cước không tồn tại' },
        { status: 400 }
      )
    }
    
    // Tạo single key hoặc multiple keys
    if (count && count > 1) {
      if (count > 100) {
        return NextResponse.json(
          { success: false, error: 'TOO_MANY', message: 'Tối đa 100 keys một lần' },
          { status: 400 }
        )
      }
      
      const keys = await createMultipleLicenseKeys({
        planId,
        count,
        notes,
        createdBy: session.user?.id,
      })
      
      return NextResponse.json({
        success: true,
        message: `Đã tạo ${keys.length} license keys`,
        data: { keys },
      })
    }
    
    // Single key
    const licenseKey = await createLicenseKey({
      planId,
      userId,
      notes,
      createdBy: session.user?.id,
    })

    // If assigned to a user, send email notification
    if (userId) {
      prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } })
        .then(user => {
          if (user?.email) {
            emailService.sendLicenseKeyCreatedEmail(
              user.email,
              user.name || 'Bạn',
              licenseKey.key,
              plan.name,
              licenseKey.expiresAt
            ).catch(err => console.error('❌ Failed to send license key email:', err))
          }
        }).catch(err => console.error('❌ Failed to lookup user:', err))
    }

    return NextResponse.json({
      success: true,
      message: 'Đã tạo license key',
      data: { licenseKey },
    })
  } catch (error) {
    console.error('Create license error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Lỗi server' },
      { status: 500 }
    )
  }
}

/**
 * API Route: /api/admin/licenses/[id]
 * Chi tiết và quản lý license key cụ thể
 * Methods: GET, PATCH, DELETE
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { calculateExpirationDate } from '@/lib/license-key'

interface RouteParams {
  params: { id: string }
}

// GET - Lấy chi tiết license
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'STAFF'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const license = await prisma.licenseKey.findUnique({
      where: { id: params.id },
      include: {
        plan: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        activations: {
          orderBy: { activatedAt: 'desc' },
        },
        usageLogs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            amount: true,
            status: true,
          },
        },
      },
    })
    
    if (!license) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'License không tồn tại' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: license,
    })
  } catch (error) {
    console.error('Get license error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}

// PATCH - Cập nhật license
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'STAFF'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { action, ...data } = body
    
    const license = await prisma.licenseKey.findUnique({
      where: { id: params.id },
      include: { plan: true },
    })
    
    if (!license) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'License không tồn tại' },
        { status: 404 }
      )
    }
    
    // Handle specific actions
    switch (action) {
      case 'suspend':
        await prisma.licenseKey.update({
          where: { id: params.id },
          data: { status: 'SUSPENDED' },
        })
        await logAction(params.id, 'SUSPEND', session.user?.id)
        return NextResponse.json({ success: true, message: 'Đã tạm khóa license' })
        
      case 'activate':
        await prisma.licenseKey.update({
          where: { id: params.id },
          data: { status: 'ACTIVE' },
        })
        return NextResponse.json({ success: true, message: 'Đã kích hoạt license' })
        
      case 'revoke':
        await prisma.$transaction([
          prisma.licenseKey.update({
            where: { id: params.id },
            data: { status: 'REVOKED' },
          }),
          prisma.keyActivation.updateMany({
            where: { keyId: params.id, status: 'ACTIVE' },
            data: { status: 'DEACTIVATED', deactivatedAt: new Date() },
          }),
        ])
        await logAction(params.id, 'REVOKE', session.user?.id)
        return NextResponse.json({ success: true, message: 'Đã thu hồi license' })
        
      case 'ban':
        await prisma.$transaction([
          prisma.licenseKey.update({
            where: { id: params.id },
            data: { status: 'BANNED' },
          }),
          prisma.keyActivation.updateMany({
            where: { keyId: params.id, status: 'ACTIVE' },
            data: { status: 'DEACTIVATED', deactivatedAt: new Date() },
          }),
        ])
        return NextResponse.json({ success: true, message: 'Đã cấm license' })
        
      case 'reset_hwid':
        await prisma.$transaction([
          prisma.keyActivation.updateMany({
            where: { keyId: params.id, status: 'ACTIVE' },
            data: { status: 'DEACTIVATED', deactivatedAt: new Date() },
          }),
          prisma.licenseKey.update({
            where: { id: params.id },
            data: { currentDevices: 0 },
          }),
        ])
        await logAction(params.id, 'RESET_HWID', session.user?.id)
        return NextResponse.json({ success: true, message: 'Đã reset HWID' })
        
      case 'extend':
        const { days } = data
        if (!days || days <= 0) {
          return NextResponse.json(
            { success: false, error: 'INVALID_DAYS', message: 'Số ngày không hợp lệ' },
            { status: 400 }
          )
        }
        
        const currentExpiry = license.expiresAt || new Date()
        const newExpiry = new Date(currentExpiry)
        newExpiry.setDate(newExpiry.getDate() + days)
        
        await prisma.licenseKey.update({
          where: { id: params.id },
          data: {
            expiresAt: newExpiry,
            status: 'ACTIVE', // Reactivate if expired
          },
        })
        await logAction(params.id, 'EXTEND', session.user?.id, `Extended by ${days} days`)
        return NextResponse.json({
          success: true,
          message: `Đã gia hạn thêm ${days} ngày`,
          data: { expiresAt: newExpiry },
        })
        
      default:
        // Normal update
        const updateData: any = {}
        
        if (data.userId !== undefined) updateData.userId = data.userId || null
        if (data.notes !== undefined) updateData.notes = data.notes
        if (data.maxDevices !== undefined) updateData.maxDevices = data.maxDevices
        if (data.status !== undefined) updateData.status = data.status
        
        const updated = await prisma.licenseKey.update({
          where: { id: params.id },
          data: updateData,
          include: {
            plan: true,
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        })
        
        return NextResponse.json({
          success: true,
          message: 'Đã cập nhật license',
          data: updated,
        })
    }
  } catch (error) {
    console.error('Update license error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}

// DELETE - Xóa license
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Xóa license và các relations
    await prisma.$transaction([
      prisma.keyUsageLog.deleteMany({ where: { keyId: params.id } }),
      prisma.keyActivation.deleteMany({ where: { keyId: params.id } }),
      prisma.licenseKey.delete({ where: { id: params.id } }),
    ])
    
    return NextResponse.json({
      success: true,
      message: 'Đã xóa license',
    })
  } catch (error) {
    console.error('Delete license error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}

// Helper function to log actions
async function logAction(keyId: string, action: string, userId?: string, details?: string) {
  try {
    await prisma.keyUsageLog.create({
      data: {
        keyId,
        action: action as any,
        details: details ? JSON.stringify({ adminAction: true, details, userId }) : JSON.stringify({ adminAction: true, userId }),
        success: true,
      },
    })
  } catch (error) {
    console.error('Failed to log action:', error)
  }
}

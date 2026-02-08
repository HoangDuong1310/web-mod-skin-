/**
 * API Route: /api/admin/resellers/[id]
 * Chi tiết reseller cho admin
 * Methods: GET, PATCH, DELETE
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Get reseller details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'STAFF'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reseller = await prisma.reseller.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
        freeKeyPlan: {
          select: {
            id: true,
            name: true,
            durationType: true,
            durationValue: true,
            price: true,
          },
        },
        apiKeys: {
          select: {
            id: true,
            apiKey: true,
            name: true,
            isActive: true,
            lastUsedAt: true,
            lastUsedIp: true,
            rateLimit: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        keyAllocations: {
          include: {
            licenseKey: {
              select: {
                key: true,
                status: true,
                expiresAt: true,
                plan: {
                  select: {
                    name: true,
                    durationType: true,
                  },
                },
              },
            },
          },
          orderBy: { allocatedAt: 'desc' },
          take: 50,
        },
        _count: {
          select: {
            keyAllocations: true,
            transactions: true,
            apiKeys: true,
          },
        },
      },
    })

    if (!reseller) {
      return NextResponse.json({ error: 'Reseller not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      reseller: {
        ...reseller,
        balance: Number(reseller.balance),
        totalSpent: Number(reseller.totalSpent),
        transactions: reseller.transactions.map((t: any) => ({
          ...t,
          amount: Number(t.amount),
          balanceBefore: Number(t.balanceBefore),
          balanceAfter: Number(t.balanceAfter),
          unitPrice: t.unitPrice ? Number(t.unitPrice) : null,
          discount: t.discount ? Number(t.discount) : null,
        })),
      },
    })
  } catch (error) {
    console.error('Admin reseller detail GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Soft delete reseller
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 })
    }

    // Soft delete
    await prisma.reseller.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    // Deactivate all API keys
    await prisma.resellerApiKey.updateMany({
      where: { resellerId: params.id },
      data: { isActive: false },
    })

    // Reset user role back to USER
    const reseller = await prisma.reseller.findUnique({
      where: { id: params.id },
      select: { userId: true },
    })

    if (reseller) {
      await prisma.user.update({
        where: { id: reseller.userId },
        data: { role: 'USER' },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Reseller deleted and API keys deactivated',
    })
  } catch (error) {
    console.error('Admin reseller DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * API Route: /api/reseller/profile
 * Xem & cập nhật profile reseller
 * Method: GET, PUT
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reseller = await prisma.reseller.findUnique({
      where: { userId: session.user.id },
      include: {
        apiKeys: {
          where: { isActive: true },
          select: {
            id: true,
            apiKey: true,
            name: true,
            lastUsedAt: true,
            createdAt: true,
            rateLimit: true,
          },
        },
        freeKeyPlan: {
          select: {
            id: true,
            name: true,
            durationType: true,
            durationValue: true,
          },
        },
        _count: {
          select: {
            keyAllocations: true,
            transactions: true,
          },
        },
      },
    })

    if (!reseller) {
      return NextResponse.json(
        { error: 'Reseller profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      reseller: {
        id: reseller.id,
        businessName: reseller.businessName,
        contactEmail: reseller.contactEmail,
        contactPhone: reseller.contactPhone,
        website: reseller.website,
        description: reseller.description,
        status: reseller.status,
        balance: Number(reseller.balance),
        totalSpent: Number(reseller.totalSpent),
        currency: reseller.currency,
        discountPercent: reseller.discountPercent,
        freeKeyQuotaDaily: reseller.freeKeyQuotaDaily,
        freeKeyQuotaMonthly: reseller.freeKeyQuotaMonthly,
        freeKeyPlan: reseller.freeKeyPlan,
        maxKeysPerOrder: reseller.maxKeysPerOrder,
        apiKeys: reseller.apiKeys,
        totalKeys: reseller._count.keyAllocations,
        totalTransactions: reseller._count.transactions,
        createdAt: reseller.createdAt,
      },
    })
  } catch (error) {
    console.error('Reseller profile GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const updateSchema = z.object({
  businessName: z.string().min(2).max(200).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().max(2000).optional(),
})

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reseller = await prisma.reseller.findUnique({
      where: { userId: session.user.id },
    })

    if (!reseller) {
      return NextResponse.json(
        { error: 'Reseller profile not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validated = updateSchema.parse(body)

    const updated = await prisma.reseller.update({
      where: { id: reseller.id },
      data: {
        ...validated,
        website: validated.website || null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      reseller: {
        id: updated.id,
        businessName: updated.businessName,
        contactEmail: updated.contactEmail,
        contactPhone: updated.contactPhone,
        website: updated.website,
        description: updated.description,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Reseller profile PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

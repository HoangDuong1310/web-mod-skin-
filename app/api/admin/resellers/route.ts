/**
 * API Route: /api/admin/resellers
 * Admin quản lý resellers
 * Methods: GET (list), POST (create/approve)
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateResellerApiKey } from '@/lib/reseller'

// GET - List all resellers
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'STAFF'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Sub-query: get plans list for config dialog
    if (searchParams.get('getPlans') === 'true') {
      const plans = await prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        select: { id: true, name: true, durationType: true, durationValue: true, price: true },
        orderBy: { price: 'asc' },
      })
      return NextResponse.json({
        success: true,
        plans: plans.map((p: any) => ({ ...p, price: Number(p.price) })),
      })
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {
      deletedAt: null,
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { businessName: { contains: search } },
        { contactEmail: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ]
    }

    const [resellers, total, stats, aggregates] = await Promise.all([
      prisma.reseller.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          freeKeyPlan: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              keyAllocations: true,
              transactions: true,
              apiKeys: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.reseller.count({ where }),
      // Stats
      Promise.all([
        prisma.reseller.count({ where: { status: 'PENDING', deletedAt: null } }),
        prisma.reseller.count({ where: { status: 'APPROVED', deletedAt: null } }),
        prisma.reseller.count({ where: { status: 'SUSPENDED', deletedAt: null } }),
        prisma.reseller.count({ where: { status: 'REJECTED', deletedAt: null } }),
        prisma.reseller.count({ where: { deletedAt: null } }),
      ]),
      prisma.reseller.aggregate({
        where: { deletedAt: null },
        _sum: { balance: true, totalSpent: true },
      }),
    ])

    return NextResponse.json({
      success: true,
      resellers: resellers.map((r: any) => ({
        id: r.id,
        businessName: r.businessName,
        contactEmail: r.contactEmail,
        contactPhone: r.contactPhone,
        website: r.website,
        status: r.status,
        balance: Number(r.balance),
        totalSpent: Number(r.totalSpent),
        currency: r.currency,
        discountPercent: r.discountPercent,
        freeKeyQuotaDaily: r.freeKeyQuotaDaily,
        freeKeyQuotaMonthly: r.freeKeyQuotaMonthly,
        maxKeysPerOrder: r.maxKeysPerOrder,
        user: r.user,
        freeKeyPlan: r.freeKeyPlan,
        _count: {
          keyAllocations: r._count.keyAllocations,
          transactions: r._count.transactions,
          apiKeys: r._count.apiKeys,
        },
        createdAt: r.createdAt,
        approvedAt: r.approvedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        pending: stats[0],
        approved: stats[1],
        suspended: stats[2],
        rejected: stats[3],
        total: stats[4],
        totalBalance: Number(aggregates._sum.balance || 0),
        totalSpent: Number(aggregates._sum.totalSpent || 0),
      },
    })
  } catch (error) {
    console.error('Admin resellers GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Admin create reseller or approve pending
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    // Route to different actions
    switch (action) {
      case 'approve': {
        const { resellerId, freeKeyQuotaDaily, freeKeyQuotaMonthly, freeKeyPlanId, discountPercent, maxKeysPerOrder } = body

        if (!resellerId) {
          return NextResponse.json({ error: 'resellerId is required' }, { status: 400 })
        }

        const reseller = await prisma.reseller.findUnique({
          where: { id: resellerId },
        })

        if (!reseller) {
          return NextResponse.json({ error: 'Reseller not found' }, { status: 404 })
        }

        // Approve and configure
        const updated = await prisma.reseller.update({
          where: { id: resellerId },
          data: {
            status: 'APPROVED',
            approvedAt: new Date(),
            approvedBy: session.user.id,
            ...(freeKeyQuotaDaily !== undefined ? { freeKeyQuotaDaily } : {}),
            ...(freeKeyQuotaMonthly !== undefined ? { freeKeyQuotaMonthly } : {}),
            ...(freeKeyPlanId !== undefined ? { freeKeyPlanId } : {}),
            ...(discountPercent !== undefined ? { discountPercent } : {}),
            ...(maxKeysPerOrder !== undefined ? { maxKeysPerOrder } : {}),
          },
        })

        // Generate API key automatically
        const apiKeyString = generateResellerApiKey()
        const resellerApiKey = await prisma.resellerApiKey.create({
          data: {
            resellerId,
            apiKey: apiKeyString,
            name: 'Default API Key',
          },
        })

        // Update user role to RESELLER
        await prisma.user.update({
          where: { id: reseller.userId },
          data: { role: 'RESELLER' },
        })

        return NextResponse.json({
          success: true,
          message: 'Reseller approved successfully',
          reseller: {
            id: updated.id,
            businessName: updated.businessName,
            status: updated.status,
          },
          apiKey: resellerApiKey.apiKey,
        })
      }

      case 'reject': {
        const { resellerId, reason } = body

        if (!resellerId) {
          return NextResponse.json({ error: 'resellerId is required' }, { status: 400 })
        }

        const updated = await prisma.reseller.update({
          where: { id: resellerId },
          data: {
            status: 'REJECTED',
            rejectedReason: reason || null,
          },
        })

        return NextResponse.json({
          success: true,
          message: 'Reseller rejected',
          reseller: { id: updated.id, status: updated.status },
        })
      }

      case 'suspend': {
        const { resellerId, reason } = body

        if (!resellerId) {
          return NextResponse.json({ error: 'resellerId is required' }, { status: 400 })
        }

        await prisma.reseller.update({
          where: { id: resellerId },
          data: { status: 'SUSPENDED', rejectedReason: reason || 'Suspended by admin' },
        })

        // Deactivate all API keys
        await prisma.resellerApiKey.updateMany({
          where: { resellerId },
          data: { isActive: false },
        })

        return NextResponse.json({
          success: true,
          message: 'Reseller suspended and API keys deactivated',
        })
      }

      case 'unsuspend': {
        const { resellerId } = body

        if (!resellerId) {
          return NextResponse.json({ error: 'resellerId is required' }, { status: 400 })
        }

        await prisma.reseller.update({
          where: { id: resellerId },
          data: { status: 'APPROVED', rejectedReason: null },
        })

        // Reactivate API keys
        await prisma.resellerApiKey.updateMany({
          where: { resellerId },
          data: { isActive: true },
        })

        return NextResponse.json({
          success: true,
          message: 'Reseller unsuspended and API keys reactivated',
        })
      }

      case 'add_credit': {
        const { resellerId, amount, description } = body

        if (!resellerId || !amount || amount <= 0) {
          return NextResponse.json(
            { error: 'resellerId and positive amount are required' },
            { status: 400 }
          )
        }

        const reseller = await prisma.reseller.findUnique({
          where: { id: resellerId },
        })

        if (!reseller) {
          return NextResponse.json({ error: 'Reseller not found' }, { status: 404 })
        }

        const currentBalance = Number(reseller.balance)
        const newBalance = currentBalance + amount

        await prisma.$transaction([
          prisma.reseller.update({
            where: { id: resellerId },
            data: { balance: newBalance },
          }),
          prisma.resellerTransaction.create({
            data: {
              resellerId,
              type: 'DEPOSIT',
              amount,
              balanceBefore: currentBalance,
              balanceAfter: newBalance,
              description: description || `Admin deposit by ${session.user.email}`,
              createdBy: session.user.id,
            },
          }),
        ])

        return NextResponse.json({
          success: true,
          message: `Added ${amount} credit to reseller`,
          newBalance,
        })
      }

      case 'update_config': {
        const { resellerId, freeKeyQuotaDaily, freeKeyQuotaMonthly, freeKeyPlanId, discountPercent, maxKeysPerOrder } = body

        if (!resellerId) {
          return NextResponse.json({ error: 'resellerId is required' }, { status: 400 })
        }

        const updateData: any = {}
        if (freeKeyQuotaDaily !== undefined) updateData.freeKeyQuotaDaily = freeKeyQuotaDaily
        if (freeKeyQuotaMonthly !== undefined) updateData.freeKeyQuotaMonthly = freeKeyQuotaMonthly
        if (freeKeyPlanId !== undefined) updateData.freeKeyPlanId = freeKeyPlanId || null
        if (discountPercent !== undefined) updateData.discountPercent = discountPercent
        if (maxKeysPerOrder !== undefined) updateData.maxKeysPerOrder = maxKeysPerOrder

        const updated = await prisma.reseller.update({
          where: { id: resellerId },
          data: updateData,
        })

        return NextResponse.json({
          success: true,
          message: 'Reseller configuration updated',
          reseller: {
            id: updated.id,
            freeKeyQuotaDaily: updated.freeKeyQuotaDaily,
            freeKeyQuotaMonthly: updated.freeKeyQuotaMonthly,
            freeKeyPlanId: updated.freeKeyPlanId,
            discountPercent: updated.discountPercent,
            maxKeysPerOrder: updated.maxKeysPerOrder,
          },
        })
      }

      case 'generate_api_key': {
        const { resellerId, name } = body

        if (!resellerId) {
          return NextResponse.json({ error: 'resellerId is required' }, { status: 400 })
        }

        const apiKeyString = generateResellerApiKey()
        const resellerApiKey = await prisma.resellerApiKey.create({
          data: {
            resellerId,
            apiKey: apiKeyString,
            name: name || 'API Key',
          },
        })

        return NextResponse.json({
          success: true,
          message: 'New API key generated',
          apiKey: resellerApiKey.apiKey,
        })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid: approve, reject, suspend, unsuspend, add_credit, update_config, generate_api_key` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Admin resellers POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

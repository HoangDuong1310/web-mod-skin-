/**
 * API Route: /api/reseller/balance
 * Xem số dư & lịch sử giao dịch
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
 * GET /api/reseller/balance
 * Get balance and transaction history
 * 
 * Query params:
 *   page (default: 1)
 *   limit (default: 20, max: 100)
 *   type (DEPOSIT | PURCHASE_KEY | REFUND | ADJUSTMENT | BONUS)
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

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const type = searchParams.get('type')

    const where: any = {
      resellerId: reseller.id,
    }

    if (type) {
      where.type = type
    }

    const [transactions, total, resellerData] = await Promise.all([
      prisma.resellerTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.resellerTransaction.count({ where }),
      prisma.reseller.findUnique({
        where: { id: reseller.id },
        select: {
          balance: true,
          totalSpent: true,
          currency: true,
          discountPercent: true,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      balance: Number(resellerData?.balance || 0),
      totalSpent: Number(resellerData?.totalSpent || 0),
      currency: resellerData?.currency || 'VND',
      discountPercent: resellerData?.discountPercent || 0,
      transactions: transactions.map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        balanceBefore: Number(t.balanceBefore),
        balanceAfter: Number(t.balanceAfter),
        description: t.description,
        reference: t.reference,
        planId: t.planId,
        quantity: t.quantity,
        unitPrice: t.unitPrice ? Number(t.unitPrice) : null,
        discount: t.discount ? Number(t.discount) : null,
        createdAt: t.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Reseller balance GET error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}

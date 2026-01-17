import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Lấy tất cả orders (admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build filter
    const where: any = {}
    if (status) where.status = status
    if (paymentStatus) where.paymentStatus = paymentStatus
    if (search) {
      where.OR = [
        { orderCode: { contains: search } },
        { user: { email: { contains: search } } },
        { user: { name: { contains: search } } },
      ]
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          plan: {
            select: {
              id: true,
              name: true,
              slug: true,
              durationType: true,
            },
          },
          licenseKey: {
            select: {
              id: true,
              key: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    // Get stats
    const [
      totalRevenue,
      pendingCount,
      completedCount,
      todayOrders,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { paymentStatus: 'COMPLETED' },
        _sum: { totalAmount: true },
      }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'COMPLETED' } }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ])

    return NextResponse.json({
      orders: orders.map(order => ({
        ...order,
        totalAmount: Number(order.totalAmount),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
        pendingCount,
        completedCount,
        todayOrders,
      },
    })
  } catch (error) {
    console.error('Get admin orders error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
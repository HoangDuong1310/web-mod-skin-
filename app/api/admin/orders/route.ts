import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Prisma } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addDays, addMonths, format, startOfMonth } from 'date-fns'

export const dynamic = 'force-dynamic'

type RevenueTrendRow = {
  bucket: string
  revenue: Prisma.Decimal | number | string | null
  orders: bigint | number | null
}

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
        { orderNumber: { contains: search } },
        { user: { email: { contains: search } } },
        { user: { name: { contains: search } } },
      ]
    }
    // Xóa các đơn PENDING quá 30 phút
    const now = new Date();
    await prisma.order.deleteMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: new Date(now.getTime() - 30 * 60 * 1000) },
      },
    });
    // Ẩn đơn PENDING quá 30 phút
    where.OR = [
      { status: { not: 'PENDING' } },
      {
        status: 'PENDING',
        createdAt: {
          gte: new Date(now.getTime() - 30 * 60 * 1000),
        },
      },
    ];

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
      dailyRevenueRows,
      monthlyRevenueRows,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { paymentStatus: 'COMPLETED' },
        _sum: { finalAmount: true },
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
      prisma.$queryRaw<RevenueTrendRow[]>(Prisma.sql`
        SELECT
          DATE(COALESCE(paidAt, createdAt)) as bucket,
          SUM(finalAmount) as revenue,
          COUNT(*) as orders
        FROM orders
        WHERE paymentStatus = 'COMPLETED'
          AND COALESCE(paidAt, createdAt) >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
        GROUP BY DATE(COALESCE(paidAt, createdAt))
        ORDER BY bucket ASC
      `),
      prisma.$queryRaw<RevenueTrendRow[]>(Prisma.sql`
        SELECT
          DATE_FORMAT(COALESCE(paidAt, createdAt), '%Y-%m') as bucket,
          SUM(finalAmount) as revenue,
          COUNT(*) as orders
        FROM orders
        WHERE paymentStatus = 'COMPLETED'
          AND COALESCE(paidAt, createdAt) >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 11 MONTH)
        GROUP BY DATE_FORMAT(COALESCE(paidAt, createdAt), '%Y-%m')
        ORDER BY bucket ASC
      `),
    ])

    const dailyRevenueMap = new Map(
      dailyRevenueRows.map((row) => [
        row.bucket,
        {
          revenue: Number(row.revenue || 0),
          orders: Number(row.orders || 0),
        },
      ])
    )

    const monthlyRevenueMap = new Map(
      monthlyRevenueRows.map((row) => [
        row.bucket,
        {
          revenue: Number(row.revenue || 0),
          orders: Number(row.orders || 0),
        },
      ])
    )

    const today = new Date()
    const dailyRevenueTrend = Array.from({ length: 30 }, (_, index) => {
      const date = addDays(today, index - 29)
      const bucket = format(date, 'yyyy-MM-dd')
      const values = dailyRevenueMap.get(bucket)

      return {
        date: bucket,
        revenue: values?.revenue || 0,
        orders: values?.orders || 0,
      }
    })

    const currentMonth = startOfMonth(today)
    const monthlyRevenueTrend = Array.from({ length: 12 }, (_, index) => {
      const month = addMonths(currentMonth, index - 11)
      const bucket = format(month, 'yyyy-MM')
      const values = monthlyRevenueMap.get(bucket)

      return {
        month: bucket,
        revenue: values?.revenue || 0,
        orders: values?.orders || 0,
      }
    })

    return NextResponse.json({
      orders: orders.map(order => ({
        ...order,
        totalAmount: Number(order.finalAmount),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalRevenue: Number(totalRevenue._sum.finalAmount || 0),
        pendingCount,
        completedCount,
        todayOrders,
        revenueTrend: {
          daily: dailyRevenueTrend,
          monthly: monthlyRevenueTrend,
        },
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
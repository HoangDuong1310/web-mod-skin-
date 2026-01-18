import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateKeyString } from '@/lib/license-key'
import { generateVietQRUrl } from '@/lib/vietqr'
import { BANK_CONFIG } from '@/lib/payment-config'

function generateOrderCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD${timestamp}${random}`
}

// GET - Lấy danh sách orders của user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date();
    // Lấy tất cả orders hợp lệ
    const allOrders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { status: { not: 'PENDING' } },
          {
            status: 'PENDING',
            createdAt: {
              gte: new Date(now.getTime() - 30 * 60 * 1000),
            },
          },
        ],
      },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            slug: true,
            durationType: true,
            durationValue: true,
          },
        },
        licenseKey: {
          select: {
            id: true,
            key: true,
            status: true,
            expiresAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Lọc: chỉ giữ đơn PENDING mới nhất cho mỗi plan, các đơn đã xử lý thì giữ hết
    const seenPendingPlans = new Set();
    const filteredOrders = allOrders.filter(order => {
      if (order.status !== 'PENDING') return true;
      if (seenPendingPlans.has(order.planId)) return false;
      seenPendingPlans.add(order.planId);
      return true;
    });

    return NextResponse.json({
      orders: filteredOrders.map((order: any) => ({
        ...order,
        totalAmount: Number(order.finalAmount),
      })),
    })
  } catch (error) {
    console.error('Get orders error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// POST - Tạo order mới
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planId, paymentMethod = 'BANK_TRANSFER' } = body

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      )
    }

    // Get plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { 
        id: planId,
        isActive: true,
        deletedAt: null,
      },
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found or inactive' },
        { status: 404 }
      )
    }

    // Check for existing pending order for same plan
    const existingOrder = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        planId: plan.id,
        status: 'PENDING',
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // Within last 30 minutes
        },
      },
    })

    if (existingOrder) {
      // Return existing order
      const qrUrl = generateVietQRUrl(BANK_CONFIG, {
        amount: Number(existingOrder.finalAmount),
        addInfo: existingOrder.orderNumber,
      })

      return NextResponse.json({
        order: {
          ...existingOrder,
          totalAmount: Number(existingOrder.finalAmount),
        },
        qrUrl,
        message: 'Existing pending order returned',
      })
    }

    // Generate order code
    const orderCode = generateOrderCode()

    // Generate order number (sequential or timestamp-based)
    const orderNumber = `ORD-${Date.now()}`

    // Create order (no license key yet)
    const validPaymentMethod = ['BANK_TRANSFER','MOMO','VNPAY','ZALOPAY','PAYPAL','CRYPTO','MANUAL'].includes(paymentMethod)
      ? paymentMethod
      : 'BANK_TRANSFER';
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: session.user.id,
        planId: plan.id,
        amount: plan.price,
        finalAmount: plan.price,
        currency: plan.currency,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: validPaymentMethod,
        customerEmail: session.user.email || '',
      },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    // Generate QR code URL
    const qrUrl = generateVietQRUrl(BANK_CONFIG, {
      amount: Number(order.finalAmount),
      addInfo: orderNumber,
    })

    return NextResponse.json({
      order: {
        ...order,
        totalAmount: Number(order.finalAmount),
      },
      qrUrl,
      message: 'Order created successfully',
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateExpirationDate } from '@/lib/license-key'

// POST - Check payment status and activate license
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        licenseKey: true,
        plan: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // If already paid
    if (order.paymentStatus === 'COMPLETED') {
      return NextResponse.json({
        paid: true,
        order: {
          ...order,
          totalAmount: Number(order.totalAmount),
        },
        message: 'Payment already confirmed',
      })
    }

    // In production, you would integrate with bank API or webhook
    // For now, we'll provide a manual confirmation endpoint
    // This endpoint can be called by admin or webhook

    return NextResponse.json({
      paid: false,
      order: {
        id: order.id,
        orderCode: order.orderCode,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: Number(order.totalAmount),
      },
      message: 'Payment not yet confirmed. Please wait 1-2 minutes after transfer.',
    })
  } catch (error) {
    console.error('Check payment error:', error)
    return NextResponse.json(
      { error: 'Failed to check payment' },
      { status: 500 }
    )
  }
}

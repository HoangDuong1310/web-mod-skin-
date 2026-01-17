import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/orders/find-user-by-order-message?message=ORDxxxx
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
    const message = searchParams.get('message')?.trim() || ''
    if (!message || !/^ORD/i.test(message)) {
      return NextResponse.json({ error: 'Message must contain a valid order code (ORD...)' }, { status: 400 })
    }
    // Chuẩn hóa message: loại bỏ dấu gạch ngang để tìm kiếm gần đúng
    const normalizedMsg = message.replace(/-/g, '').toUpperCase();
    // Tìm order có orderNumber gần đúng
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: message },
          { orderNumber: { equals: message } },
          { orderNumber: { contains: normalizedMsg.slice(3) } }, // bỏ 'ORD' nếu cần
          { orderNumber: { contains: normalizedMsg } },
          { orderNumber: { endsWith: normalizedMsg.slice(3) } },
        ],
      },
    });
    if (!order) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng với mã này!' }, { status: 404 })
    }
    // Lấy user và plan liên quan
    const user = order.userId
      ? await prisma.user.findUnique({ where: { id: order.userId }, select: { id: true, name: true, email: true } })
      : null;
    const plan = order.planId
      ? await prisma.subscriptionPlan.findUnique({ where: { id: order.planId }, select: { id: true, name: true } })
      : null;
    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        user,
        plan,
      }
    })
  } catch (error) {
    console.error('Find user by order message error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

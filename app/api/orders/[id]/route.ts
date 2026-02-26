import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateExpirationDate, generateKeyString } from '@/lib/license-key'
import { emailService } from '@/lib/email'

// GET - Get order details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role

    // Build query - admin can see all, users only their own
    const whereClause: any = { id: params.id }
    if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
      whereClause.userId = session.user.id
    }

    const order = await prisma.order.findFirst({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        plan: true,
        licenseKey: {
          include: {
            activations: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      order: {
        ...order,
        finalAmount: Number(order.finalAmount),
      },
    })
  } catch (error) {
    console.error('Get order error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

// PATCH - Update order (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { status, paymentStatus, notes } = body

    const order = await prisma.order.findUnique({
      where: { id: params.id },
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

    // Prepare update data
    const updateData: any = {}
    if (status) updateData.status = status
    if (paymentStatus) updateData.paymentStatus = paymentStatus
    if (notes !== undefined) updateData.notes = notes

    // If confirming payment, activate the license key
    if (paymentStatus === 'COMPLETED' && order.paymentStatus !== 'COMPLETED') {
      updateData.status = 'COMPLETED';
      updateData.paidAt = new Date(Date.now());
      // Use UTC timestamp for activation to avoid timezone issues
      const now = new Date(Date.now());
      // Nếu đã có key thì active, nếu chưa có thì tạo mới
      if (order.licenseKey && order.plan) {
        const expiresAt = calculateExpirationDate(
          order.plan.durationType,
          order.plan.durationValue,
          now
        );
        await prisma.licenseKey.update({
          where: { id: order.licenseKey.id },
          data: {
            status: 'ACTIVE',
            activatedAt: now,
            expiresAt,
            maxDevices: order.plan.maxDevices, // Thiết lập đúng maxDevices từ plan
          },
        });
        // Log the activation
        await prisma.keyUsageLog.create({
          data: {
            keyId: order.licenseKey.id,
            action: 'ACTIVATE',
            details: JSON.stringify({
              orderId: order.id,
              orderNumber: order.orderNumber,
              activatedBy: session.user.id,
            }),
          },
        });
      } else if (order.plan) {
        // Tạo key mới, gán cho order
        const keyString = generateKeyString();
        const expiresAt = calculateExpirationDate(
          order.plan.durationType,
          order.plan.durationValue,
          now
        );
        const newKey = await prisma.licenseKey.create({
          data: {
            key: keyString,
            userId: order.userId,
            planId: order.plan.id,
            maxDevices: order.plan.maxDevices, // Thiết lập đúng maxDevices từ plan
            status: 'ACTIVE',
            activatedAt: now,
            expiresAt,
            order: { connect: { id: order.id } },
          },
        });
        updateData.keyId = newKey.id;
        // Log the activation
        await prisma.keyUsageLog.create({
          data: {
            keyId: newKey.id,
            action: 'ACTIVATE',
            details: JSON.stringify({
              orderId: order.id,
              orderNumber: order.orderNumber,
              activatedBy: session.user.id,
            }),
          },
        });
      }
    }
    if ((paymentStatus === 'REFUNDED' || status === 'CANCELLED') &&
      order.licenseKey &&
      order.paymentStatus === 'COMPLETED') {
      await prisma.licenseKey.update({
        where: { id: order.licenseKey.id },
        data: {
          status: 'REVOKED',
        },
      })

      await prisma.keyUsageLog.create({
        data: {
          keyId: order.licenseKey.id,
          action: 'REVOKE',
          details: JSON.stringify({
            reason: paymentStatus === 'REFUNDED' ? 'Refunded' : 'Order cancelled',
            revokedBy: session.user.id,
          }),
        },
      });

      // Notify user about order cancellation/refund
      if (order.userId) {
        prisma.user.findUnique({ where: { id: order.userId }, select: { email: true, name: true } })
          .then(user => {
            if (user?.email) {
              emailService.sendOrderCancellationEmail(
                user.email,
                user.name || 'Bạn',
                order.orderNumber,
                order.plan?.name || 'Gói dịch vụ',
                paymentStatus === 'REFUNDED' ? 'REFUNDED' : 'CANCELLED'
              ).catch(err => console.error('❌ Failed to send cancellation email:', err))
            }
          }).catch(err => console.error('❌ Failed to lookup user for cancel email:', err))
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        plan: true,
        licenseKey: true,
      },
    })

    // Send payment success email when payment is confirmed
    if (paymentStatus === 'COMPLETED' && order.paymentStatus !== 'COMPLETED' && updatedOrder.licenseKey?.key) {
      const userEmail = updatedOrder.user?.email
      if (userEmail) {
        emailService.sendPaymentSuccessEmail(
          userEmail,
          updatedOrder.user?.name || 'Bạn',
          updatedOrder.orderNumber,
          updatedOrder.plan?.name || 'Gói dịch vụ',
          Number(updatedOrder.finalAmount),
          updatedOrder.currency || 'VND',
          updatedOrder.licenseKey.key,
          updatedOrder.licenseKey.expiresAt
        ).catch(err => console.error('❌ Failed to send payment success email:', err))
      }
    }

    return NextResponse.json({
      order: {
        ...updatedOrder,
        finalAmount: Number(updatedOrder.finalAmount),
      },
      message: 'Order updated successfully',
    });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
// DELETE - Cancel/delete order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { licenseKey: true },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Delete associated license key if not used
    if (order.licenseKey && order.licenseKey.status === 'INACTIVE') {
      await prisma.licenseKey.delete({
        where: { id: order.licenseKey.id },
      })
    }

    // Delete order
    await prisma.order.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: 'Order deleted successfully',
    })
  } catch (error) {
    console.error('Delete order error:', error)
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    )
  }
}

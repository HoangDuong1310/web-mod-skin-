import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateExpirationDate } from '@/lib/license-key'
import crypto from 'crypto'
import { emailService } from '@/lib/email'

// Secret key để verify webhook (set trong .env)
const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET
if (!WEBHOOK_SECRET) {
  console.log("Miss credetinal");
}
interface PaymentWebhookPayload {
  orderCode: string
  amount: number
  transactionId: string
  bankCode?: string
  paidAt?: string
  signature?: string
}

// Verify webhook signature
function verifySignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return false
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

/**
 * POST /api/webhooks/payment
 * 
 * Webhook endpoint để nhận thông báo thanh toán từ payment gateway hoặc bank
 * 
 * Expected payload:
 * {
 *   "orderCode": "ORD...",
 *   "amount": 150000,
 *   "transactionId": "TXN123456",
 *   "bankCode": "MBB",
 *   "paidAt": "2024-01-15T10:30:00Z",
 *   "signature": "sha256_hmac_signature"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const payload: PaymentWebhookPayload = JSON.parse(body)

    //REVIEWME:
    if (!payload.signature) {
      console.error('Thieu truong signature')
      return NextResponse.json(
        { error: 'NO CHEAT PLS' },
        { status: 401 }
      )
    }

    // Verify signature
    const dataToVerify = JSON.stringify({
      orderCode: payload.orderCode,
      amount: payload.amount,
      transactionId: payload.transactionId,
    })

    if (!verifySignature(dataToVerify, payload.signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const { orderCode, amount, transactionId, paidAt } = payload

    if (!orderCode || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: orderCode, amount' },
        { status: 400 }
      )
    }

    // Find order by code
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: orderCode,
        status: 'PENDING',
      },
      include: {
        licenseKey: true,
        plan: true,
      },
    })

    if (!order) {
      console.log(`Order not found or already processed: ${orderCode}`)
      return NextResponse.json(
        { error: 'Order not found or already processed' },
        { status: 404 }
      )
    }

    // Verify amount matches
    if (Number(order.finalAmount) !== amount) {
      console.error(`Amount mismatch for order ${orderCode}: expected ${order.finalAmount}, got ${amount}`)
      return NextResponse.json(
        { error: 'Amount mismatch' },
        { status: 400 }
      )
    }

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'COMPLETED',
        paymentStatus: 'COMPLETED',
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        adminNote: transactionId ? `Transaction ID: ${transactionId}` : undefined,
      },
    })

    // Activate license key
    if (order.licenseKey && order.plan) {
      const expiresAt = calculateExpirationDate(
        order.plan.durationType,
        order.plan.durationValue
      )

      await prisma.licenseKey.update({
        where: { id: order.licenseKey.id },
        data: {
          status: 'ACTIVE',
          activatedAt: new Date(),
          expiresAt,
          maxDevices: order.plan.maxDevices, // Thiết lập đúng maxDevices từ plan
        },
      })

      // Log activation
      await prisma.keyUsageLog.create({
        data: {
          keyId: order.licenseKey.id,
          action: 'ACTIVATE',
          details: JSON.stringify({
            orderId: order.id,
            orderNumber: order.orderNumber,
            transactionId,
            activatedVia: 'webhook',
          }),
        },
      })

      console.log(`License ${order.licenseKey.key} activated for order ${orderCode}`)
      console.log(`Plan: ${order.plan.name}, MaxDevices: ${order.plan.maxDevices}, ExpiresAt: ${expiresAt}`)
    }

    // Send payment success email with license key
    if (order.licenseKey?.key && order.userId) {
      const user = await prisma.user.findUnique({ where: { id: order.userId }, select: { email: true, name: true } })
      if (user?.email) {
        emailService.sendPaymentSuccessEmail(
          user.email,
          user.name ?? 'Bạn',
          order.orderNumber,
          order.plan?.name || 'Gói dịch vụ',
          Number(order.finalAmount),
          order.currency || 'VND',
          order.licenseKey.key,
          order.licenseKey.expiresAt ?? undefined
        ).catch(err => console.error('❌ Failed to send payment success email:', err))
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment confirmed and license activated',
      orderId: order.id,
      licenseKey: order.licenseKey?.key,
    })
  } catch (error) {
    console.error('Payment webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'payment-webhook',
    timestamp: new Date().toISOString(),
  })
}

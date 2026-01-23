import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyKofiWebhook, parseKofiWebhook, validateKofiPayload, formatDonationForDB, validateKofiTimestamp } from '@/lib/kofi';
import { convertUSDToVND } from '@/lib/vietqr';
import { calculateExpirationDate } from '@/lib/license-key';

/**
 * Ko-fi Webhook Handler
 * Processes Ko-fi donation webhooks and creates donation records
 * 
 * Endpoint: POST /api/webhooks/kofi
 */
export async function POST(request: NextRequest) {
  try {

    // Dùng lại rate limit của ông
    const { strictLimiter } = await import('@/lib/rate-limit');
    const limiter = await strictLimiter(request);

    if (!limiter.success) {
      console.warn('Ko-fi webhook rate limited');
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    console.log('Ko-fi webhook received request');
    console.log('Headers:', Object.fromEntries(request.headers.entries()));

    // Parse Ko-fi webhook form data
    const formData = await request.formData();
    console.log('Form data keys:', [...formData.keys()]);
    const dataString = formData.get('data') as string;
    console.log('Data string length:', dataString?.length || 0);

    if (!dataString) {
      console.error('Ko-fi webhook missing data field');
      return NextResponse.json(
        { error: 'Missing data field' },
        { status: 400 }
      );
    }

    // Parse JSON from data field
    let payload;
    try {
      payload = JSON.parse(dataString);
    } catch (error) {
      console.error('Ko-fi webhook invalid JSON in data field:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in data field' },
        { status: 400 }
      );
    }

    // Validate payload structure
    const validation = validateKofiPayload(payload);
    if (!validation.isValid) {
      console.error('Ko-fi webhook validation failed:', validation.errors);
      return NextResponse.json(
        { error: 'Invalid payload', details: validation.errors },
        { status: 400 }
      );
    }

    // Get webhook verification token from environment
    const expectedToken = process.env.KOFI_WEBHOOK_TOKEN;
    if (!expectedToken) {
      console.error('KOFI_WEBHOOK_TOKEN not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Verify webhook authenticity
    if (!verifyKofiWebhook(payload, expectedToken)) {
      console.error('Ko-fi webhook verification failed');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    //Validate timestamp chống replay attack
    if (payload.timestamp && !validateKofiTimestamp(payload.timestamp)) {
      console.error(`Ko-fi webhook verification failed: Stale/Invalid Timestamp (${payload.timestamp})`);
      return NextResponse.json(
        { error: 'Bad request' },
        { status: 401 }
      );
    }

    // Parse webhook data
    const webhookData = validation.data!;
    const processed = parseKofiWebhook(webhookData);

    // Check if we already processed this transaction
    const existingDonation = await prisma.donation.findFirst({
      where: {
        kofiTransactionId: processed.kofiTransactionId
      }
    });

    if (existingDonation) {
      console.log(`Ko-fi transaction ${processed.kofiTransactionId} already processed`);
      return NextResponse.json({
        message: 'Transaction already processed',
        donationId: existingDonation.id
      });
    }

    // Try to find or create user by email
    let user = null;
    if (processed.email) {
      user = await prisma.user.findUnique({
        where: { email: processed.email }
      });

      // Create user if they don't exist and provided valid email
      if (!user && processed.email.includes('@')) {
        try {
          user = await prisma.user.create({
            data: {
              email: processed.email,
              name: processed.donorName,
              role: 'USER'
            }
          });
        } catch (error) {
          console.warn('Could not create user from Ko-fi webhook:', error);
          // Continue without user - donation can still be recorded
        }
      }
    }

    // Find active donation goal (if any)
    const activeGoal = await prisma.donationGoal.findFirst({
      where: {
        isActive: true,
        endDate: {
          gte: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Convert amount to USD if needed (Ko-fi handles multiple currencies)
    const usdAmount = processed.currency === 'USD'
      ? processed.amount
      : processed.amount; // For now, assume Ko-fi gives us USD equivalent

    // Create donation record
    const donation = await prisma.donation.create({
      data: {
        amount: usdAmount,
        currency: 'USD', // Standardize to USD
        donorName: processed.donorName,
        donorEmail: processed.email,
        message: processed.message,
        paymentMethod: 'KOFI',
        status: 'COMPLETED',
        isAnonymous: !processed.isPublic,
        kofiTransactionId: processed.kofiTransactionId,
        userId: user?.id || null,
        goalId: activeGoal?.id || null
      }
    });

    // Update donation goal progress if applicable
    if (activeGoal) {
      const totalDonations = await prisma.donation.aggregate({
        where: {
          goalId: activeGoal.id,
          status: 'COMPLETED'
        },
        _sum: {
          amount: true
        }
      });

      const currentAmount = totalDonations._sum?.amount || 0;
      const progressPercentage = Math.min((Number(currentAmount) / Number(activeGoal.targetAmount)) * 100, 100);

      await prisma.donationGoal.update({
        where: { id: activeGoal.id },
        data: {
          currentAmount
        }
      });
    }

    // ============================================
    // XỬ LÝ ORDER VÀ LICENSE KEY TỪ DONATION
    // ============================================

    // Parse order number from donation message
    // Message format: "Order: {orderNumber} {planName}"
    let orderNumber = null;
    const orderMatch = processed.message?.match(/Order:\s*(ORD[A-Z0-9]+)/i);
    if (orderMatch) {
      orderNumber = orderMatch[1];
    }

    if (orderNumber) {
      console.log(`Tìm thấy mã đơn hàng trong donation: ${orderNumber}`);

      // Tìm đơn hàng PENDING
      const pendingOrder = await prisma.order.findFirst({
        where: {
          orderNumber: orderNumber,
          status: 'PENDING',
          paymentStatus: 'PENDING'
        },
        include: {
          plan: true,
          user: true
        }
      });

      if (pendingOrder) {
        // KIỂM TRA BẢO MẬT: Xác minh số tiền
        // Convert plan price to USD for comparison
        const expectedUSD = pendingOrder.currency === 'USD'
          ? Number(pendingOrder.finalAmount)
          : Number(pendingOrder.finalAmount) / 25000; // Approximate VND to USD conversion

        if (Math.abs(usdAmount - expectedUSD) > 1) { // Allow $1 tolerance
          console.warn(`Số tiền không khớp cho đơn ${orderNumber}: expected ~$${expectedUSD}, got $${usdAmount}`);
        } else {
          // Tạo license key
          const { generateKeyString } = await import('@/lib/license-key');
          const keyString = generateKeyString();
          // Use UTC timestamp to avoid timezone issues
          const now = new Date(Date.now());
          const expiresAt = calculateExpirationDate(
            pendingOrder.plan.durationType,
            pendingOrder.plan.durationValue,
            now
          );

          const licenseKey = await prisma.licenseKey.create({
            data: {
              key: keyString,
              userId: pendingOrder.userId,
              planId: pendingOrder.planId,
              maxDevices: pendingOrder.plan.maxDevices,
              status: 'ACTIVE',
              activatedAt: now,
              expiresAt,
            }
          });

          // Cập nhật đơn hàng
          await prisma.order.update({
            where: { id: pendingOrder.id },
            data: {
              paymentStatus: 'COMPLETED',
              status: 'COMPLETED',
              transactionId: processed.kofiTransactionId,
              paidAt: new Date(),
              keyId: licenseKey.id,
              completedAt: new Date()
            }
          });

          console.log('=== KO-FI THANH TOÁN THÀNH CÔNG ===');
          console.log('Order Number:', orderNumber);
          console.log('Transaction ID:', processed.kofiTransactionId);
          console.log('Amount:', usdAmount, 'USD');
          console.log('License Key:', keyString);
          console.log('User ID:', pendingOrder.userId);
          console.log('Plan:', pendingOrder.plan.name);
          console.log('===================================');
        }
      } else {
        console.log(`Không tìm thấy đơn hàng PENDING: ${orderNumber}`);
      }
    }

    // Log successful processing
    console.log(`Ko-fi donation processed: ${donation.id} - $${usdAmount} from ${processed.donorName}`);

    // Send success response
    return NextResponse.json({
      success: true,
      donationId: donation.id,
      amount: usdAmount,
      currency: 'USD',
      transactionId: processed.kofiTransactionId
    });

  } catch (error) {
    console.error('Ko-fi webhook processing error:', error);

    // Return error response
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? String(error) : 'Webhook processing failed'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle GET requests for webhook verification/testing
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  // Simple webhook verification endpoint
  if (token && token === process.env.KOFI_WEBHOOK_TOKEN) {
    return NextResponse.json({
      message: 'Ko-fi webhook endpoint is active',
      timestamp: new Date().toISOString()
    });
  }

  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}

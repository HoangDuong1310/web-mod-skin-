import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyKofiWebhook, parseKofiWebhook, validateKofiPayload, formatDonationForDB } from '@/lib/kofi';
import { convertUSDToVND } from '@/lib/vietqr';

/**
 * Ko-fi Webhook Handler
 * Processes Ko-fi donation webhooks and creates donation records
 * 
 * Endpoint: POST /api/webhooks/kofi
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the webhook payload
    const payload = await request.json();
    
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

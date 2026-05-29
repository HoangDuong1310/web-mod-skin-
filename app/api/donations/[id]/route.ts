import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyDonation } from '@/lib/donation-service';
import { z } from 'zod';

const updateDonationSchema = z.object({
  status: z.enum(['COMPLETED', 'VERIFIED', 'FAILED', 'CANCELLED']).optional(),
  bankTxId: z.string().optional(),
});

/**
 * Update donation status (Admin only)
 * PATCH /api/donations/[id]
 *
 * Two modes:
 * - Tier-aware manual verification: body `{ status: 'VERIFIED' }` or `{ bankTxId }`
 *   -> runs verifyDonation() which marks the donation VERIFIED and upgrades donor tier.
 * - Legacy status update: body `{ status: 'COMPLETED' | 'FAILED' | 'CANCELLED' }`
 *   -> updates status and recalculates donation-goal progress.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const donationId = params.id;
    const body = await request.json().catch(() => ({}));
    const parsed = updateDonationSchema.parse(body);

    // --- Tier-aware manual verification path ---
    if (parsed.status === 'VERIFIED' || parsed.bankTxId) {
      const bankTxId = parsed.bankTxId || `MANUAL-${Date.now()}`;
      try {
        const result = await verifyDonation(donationId, bankTxId);
        return NextResponse.json({
          ok: true,
          tier: result.tier,
          alreadyVerified: result.alreadyVerified,
        });
      } catch (e) {
        console.error('Manual verify failed:', e);
        return NextResponse.json(
          { error: 'Verification failed' },
          { status: 500 }
        );
      }
    }

    // --- Legacy status-update path (donation-goal progress) ---
    if (!parsed.status) {
      return NextResponse.json(
        { error: 'status or bankTxId is required' },
        { status: 400 }
      );
    }
    const status = parsed.status;

    // Find the donation
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: { goal: true }
    });

    if (!donation) {
      return NextResponse.json(
        { error: 'Donation not found' },
        { status: 404 }
      );
    }

    // Update donation status
    const updatedDonation = await prisma.donation.update({
      where: { id: donationId },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null
      },
      include: {
        user: true,
        goal: true
      }
    });

    // If donation is completed and has a goal, update goal progress
    if (status === 'COMPLETED' && donation.goalId) {
      const goal = await prisma.donationGoal.findUnique({
        where: { id: donation.goalId }
      });

      if (goal) {
        const totalDonations = await prisma.donation.aggregate({
          where: {
            goalId: donation.goalId,
            status: 'COMPLETED'
          },
          _sum: {
            amount: true
          }
        });

        const currentAmount = totalDonations._sum.amount || 0;

        await prisma.donationGoal.update({
          where: { id: donation.goalId },
          data: {
            currentAmount: currentAmount,
            isActive: currentAmount < goal.targetAmount
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      donation: updatedDonation
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update donation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get donation details (Admin only)
 * GET /api/donations/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const donationId = params.id;

    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        user: true,
        goal: true
      }
    });

    if (!donation) {
      return NextResponse.json(
        { error: 'Donation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ donation });

  } catch (error) {
    console.error('Get donation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


export const dynamic = 'force-dynamic'

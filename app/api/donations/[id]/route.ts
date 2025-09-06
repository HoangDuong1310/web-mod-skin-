import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateDonationSchema = z.object({
  status: z.enum(['COMPLETED', 'FAILED', 'CANCELLED'])
});

/**
 * Update donation status (Admin only)
 * PATCH /api/donations/[id]
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
    const body = await request.json();
    const { status } = updateDonationSchema.parse(body);

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

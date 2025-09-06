import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateDonationQR, validateVietQRConfig } from '@/lib/vietqr';
import { z } from 'zod';

// Schema validation for donation creation
const createDonationSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.string().default('USD'),
  paymentMethod: z.enum(['KOFI', 'BANK_TRANSFER', 'MANUAL']),
  donorName: z.string().optional(),
  donorEmail: z.string().email().optional(),
  message: z.string().optional(),
  isAnonymous: z.boolean().default(false),
  goalId: z.string().optional(),
  qrUrl: z.string().optional(),
  transferNote: z.string().optional()
});

const getDonationsSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('10'),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED']).optional(),
  paymentMethod: z.enum(['KOFI', 'BANK_TRANSFER', 'MANUAL']).optional(),
  goalId: z.string().optional(),
});

/**
 * Create a new donation (for bank transfers and manual donations)
 * POST /api/donations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validatedData = createDonationSchema.parse(body);

    const {
      amount,
      currency,
      paymentMethod,
      donorName,
      donorEmail,
      message,
      isAnonymous,
      goalId,
      qrUrl,
      transferNote
    } = validatedData;

    // For anonymous donations, we need at least a name
    if (isAnonymous && !donorName) {
      return NextResponse.json(
        { error: 'Donor name is required for anonymous donations' },
        { status: 400 }
      );
    }

    // Get session for authenticated users
    const session = await getServerSession(authOptions);
    let userId = session?.user?.id || null;

    // If not anonymous and no session, try to find/create user by email
    if (!isAnonymous && !userId && donorEmail) {
      let user = await prisma.user.findUnique({
        where: { email: donorEmail }
      });

      if (!user && donorEmail.includes('@')) {
        try {
          user = await prisma.user.create({
            data: {
              email: donorEmail,
              name: donorName || 'Anonymous',
              role: 'USER'
            }
          });
          userId = user.id;
        } catch (error) {
          console.warn('Could not create user:', error);
        }
      } else if (user) {
        userId = user.id;
      }
    }

    // Validate goal if provided
    let donationGoal = null;
    if (goalId) {
      donationGoal = await prisma.donationGoal.findUnique({
        where: { id: goalId }
      });

      if (!donationGoal) {
        return NextResponse.json(
          { error: 'Donation goal not found' },
          { status: 404 }
        );
      }
    }

    // Generate unique transaction ID
    const transactionId = `${paymentMethod}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create donation record (for BANK_TRANSFER, QR info is passed from client)
    const donation = await prisma.donation.create({
      data: {
        amount: Number(amount),
        currency,
        donorName: donorName || (session?.user?.name),
        donorEmail: donorEmail || (session?.user?.email),
        message,
        isAnonymous,
        paymentMethod,
        transactionId,
        status: paymentMethod === 'MANUAL' ? 'COMPLETED' : 'PENDING',
        userId,
        goalId: goalId || null,
        qrCodeUrl: qrUrl || null,
        transferNote: transferNote || null,
        ipAddress: request.ip || null,
        userAgent: request.headers.get('user-agent') || null
      },
      include: {
        goal: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Update goal progress if applicable and donation is completed
    if (donationGoal && donation.status === 'COMPLETED') {
      const totalDonations = await prisma.donation.aggregate({
        where: {
          goalId: donationGoal.id,
          status: 'COMPLETED'
        },
        _sum: {
          amount: true
        }
      });

      const newCurrentAmount = totalDonations._sum?.amount || 0;
      
      await prisma.donationGoal.update({
        where: { id: donationGoal.id },
        data: {
          currentAmount: newCurrentAmount
        }
      });
    }

    // Return donation with QR data for bank transfers
    const response: any = {
      success: true,
      donation: {
        id: donation.id,
        amount: donation.amount,
        currency: donation.currency,
        paymentMethod: donation.paymentMethod,
        status: donation.status,
        transactionId: donation.transactionId,
        message: donation.message,
        createdAt: donation.createdAt
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Donation creation error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? String(error) : 'Failed to create donation'
      },
      { status: 500 }
    );
  }
}

/**
 * Get donations list (admin only)
 * GET /api/donations
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;
    const params = getDonationsSchema.parse(Object.fromEntries(searchParams));

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.paymentMethod) where.paymentMethod = params.paymentMethod;
    if (params.goalId) where.goalId = params.goalId;

    const [donations, total] = await Promise.all([
      prisma.donation.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          goal: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit
      }),
      prisma.donation.count({ where })
    ]);

    return NextResponse.json({
      donations,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        pages: Math.ceil(total / params.limit)
      }
    });

  } catch (error) {
    console.error('Get donations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

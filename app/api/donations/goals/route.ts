import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  targetAmount: z.number().min(1, 'Target amount must be greater than 0'),
  currency: z.string().default('USD'),
  isActive: z.boolean().default(true),
  isVisible: z.boolean().default(true),
  priority: z.number().default(0),
  startDate: z.string().transform(date => new Date(date)).optional(),
  endDate: z.string().transform(date => new Date(date)).optional(),
  showProgress: z.boolean().default(true),
  showAmount: z.boolean().default(true),
  showDonors: z.boolean().default(true),
})

const updateGoalSchema = createGoalSchema.partial()

// GET /api/donations/goals - Get donation goals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isPublic = searchParams.get('public') === 'true'

    if (isPublic) {
      // Public access - only active and visible goals
      const goals = await prisma.donationGoal.findMany({
        where: {
          isActive: true,
          isVisible: true,
        },
        include: {
          _count: {
            select: {
              donations: {
                where: {
                  status: 'COMPLETED'
                }
              }
            }
          }
        },
        orderBy: {
          priority: 'desc'
        }
      })

      return NextResponse.json({
        goals: goals.map(goal => ({
          id: goal.id,
          title: goal.title,
          description: goal.description,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount,
          currency: goal.currency,
          showProgress: goal.showProgress,
          showAmount: goal.showAmount,
          showDonors: goal.showDonors,
          startDate: goal.startDate,
          endDate: goal.endDate,
          donorCount: goal._count.donations,
          progressPercentage: Number(goal.targetAmount) > 0 
            ? Math.min((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100, 100)
            : 0
        }))
      })
    }

    // Admin access
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const goals = await prisma.donationGoal.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            donations: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ goals })

  } catch (error) {
    console.error('Error fetching donation goals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/donations/goals - Create new donation goal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 })
    }

    const body = await request.json()
    const data = createGoalSchema.parse(body)

    const goal = await prisma.donationGoal.create({
      data: {
        ...data,
        createdBy: user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      goal,
      message: 'Donation goal created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating donation goal:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/donations/goals - Update donation goal
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
        { status: 400 }
      )
    }

    const data = updateGoalSchema.parse(updateData)

    const goal = await prisma.donationGoal.update({
      where: { id },
      data,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      goal,
      message: 'Donation goal updated successfully'
    })

  } catch (error) {
    console.error('Error updating donation goal:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/donations/goals - Delete donation goal
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
        { status: 400 }
      )
    }

    // Check if goal has donations
    const donationCount = await prisma.donation.count({
      where: { goalId: id }
    })

    if (donationCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete goal with existing donations. Set to inactive instead.' },
        { status: 400 }
      )
    }

    await prisma.donationGoal.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Donation goal deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting donation goal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
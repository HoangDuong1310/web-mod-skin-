import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createReviewReplySchema, updateReviewReplySchema } from '@/lib/validations'
import { canManageReviews } from '@/lib/auth-utils'
import { emailService } from '@/lib/email'

// GET /api/reviews/replies?reviewId=xxx - Get replies for a review
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get('reviewId')

    if (!reviewId) {
      return NextResponse.json(
        { error: 'Review ID is required' },
        { status: 400 }
      )
    }

    const replies = await prisma.reviewReply.findMany({
      where: {
        reviewId,
        isVisible: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      replies: replies.map((reply: any) => ({
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt,
        user: {
          id: reply.user.id,
          name: reply.user.name,
          image: reply.user.image,
          role: reply.user.role,
        },
      })),
    })
  } catch (error) {
    console.error('Error fetching review replies:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/reviews/replies - Create a reply to a review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to reply' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = createReviewReplySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid reply data',
          details: validation.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      )
    }

    const { reviewId, content } = validation.data

    // Check if review exists and is visible
    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        deletedAt: null,
      },
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    const reply = await prisma.reviewReply.create({
      data: {
        reviewId,
        userId: session.user.id,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
      },
    })

    // Send email notification to review author (fire-and-forget)
    if (review.userId && review.userId !== session.user.id) {
      prisma.user.findUnique({
        where: { id: review.userId },
        select: { email: true, name: true },
      }).then(async (reviewer) => {
        if (reviewer?.email) {
          // Try to get product name for context
          let productName: string | undefined
          try {
            const product = await prisma.product.findUnique({
              where: { id: review.productId },
              select: { title: true },
            })
            productName = product?.title || undefined
          } catch {}

          emailService.sendReviewReplyNotification(
            reviewer.email,
            reviewer.name || 'Bạn',
            reply.user.name || 'Người dùng',
            reply.user.role,
            content.trim(),
            productName
          ).catch(err => console.error('❌ Failed to send review reply notification:', err))
        }
      }).catch(err => console.error('❌ Failed to lookup reviewer:', err))
    }

    return NextResponse.json(
      {
        reply: {
          id: reply.id,
          content: reply.content,
          createdAt: reply.createdAt,
          user: {
            id: reply.user.id,
            name: reply.user.name,
            image: reply.user.image,
            role: reply.user.role,
          },
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating review reply:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/reviews/replies - Update a reply
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = updateReviewReplySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid data',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { id, content } = validation.data

    // Find the reply
    const existingReply = await prisma.reviewReply.findUnique({
      where: { id },
    })

    if (!existingReply) {
      return NextResponse.json(
        { error: 'Reply not found' },
        { status: 404 }
      )
    }

    // Only the author or admin/staff can edit
    const isAuthor = existingReply.userId === session.user.id
    const isStaff = canManageReviews(session.user.role)

    if (!isAuthor && !isStaff) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this reply' },
        { status: 403 }
      )
    }

    const updatedReply = await prisma.reviewReply.update({
      where: { id },
      data: { content: content.trim() },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json({
      reply: {
        id: updatedReply.id,
        content: updatedReply.content,
        createdAt: updatedReply.createdAt,
        user: {
          id: updatedReply.user.id,
          name: updatedReply.user.name,
          image: updatedReply.user.image,
          role: updatedReply.user.role,
        },
      },
    })
  } catch (error) {
    console.error('Error updating review reply:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/reviews/replies?id=xxx - Delete a reply
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Reply ID is required' },
        { status: 400 }
      )
    }

    const existingReply = await prisma.reviewReply.findUnique({
      where: { id },
    })

    if (!existingReply) {
      return NextResponse.json(
        { error: 'Reply not found' },
        { status: 404 }
      )
    }

    // Only the author or admin/staff can delete
    const isAuthor = existingReply.userId === session.user.id
    const isStaff = canManageReviews(session.user.role)

    if (!isAuthor && !isStaff) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this reply' },
        { status: 403 }
      )
    }

    await prisma.reviewReply.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting review reply:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

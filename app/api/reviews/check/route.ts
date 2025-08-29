import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/reviews/check - Check if user has reviewed a product
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        hasReviewed: false,
        canReview: true,
      })
    }

    const existingReview = await prisma.review.findFirst({
      where: {
        productId,
        userId: session.user.id,
        deletedAt: null,
      },
      select: {
        id: true,
        rating: true,
        title: true,
        content: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      hasReviewed: !!existingReview,
      canReview: !existingReview,
      existingReview: existingReview || null,
    })
  } catch (error) {
    console.error('Error checking review status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Function to recalculate product rating and review count
async function recalculateProductStats(productId: string) {
  const visibleReviews = await prisma.review.findMany({
    where: {
      productId,
      isVerified: true,
      isVisible: true
    },
    select: {
      rating: true
    }
  })

  const totalReviews = visibleReviews.length
  const averageRating = totalReviews > 0
    ? visibleReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
    : 0

  await prisma.product.update({
    where: { id: productId },
    data: {
      averageRating: averageRating,
      totalReviews: totalReviews
    }
  })

  return { averageRating, totalReviews }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (status && status !== 'all') {
      if (status === 'pending') {
        where.isVerified = false
      } else if (status === 'approved') {
        where.isVerified = true
        where.isVisible = true
      } else if (status === 'hidden') {
        where.isVisible = false
      }
    }
    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { guestName: { contains: search, mode: 'insensitive' } },
        { guestEmail: { contains: search, mode: 'insensitive' } },
        { product: { title: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.review.count({ where })
    ])

    // Get stats
    const [pendingCount, approvedCount, hiddenCount] = await Promise.all([
      prisma.review.count({ where: { isVerified: false } }),
      prisma.review.count({ where: { isVerified: true, isVisible: true } }),
      prisma.review.count({ where: { isVisible: false } })
    ])

    const statusStats = {
      total: total,
      pending: pendingCount,
      approved: approvedCount,
      hidden: hiddenCount
    }

    // Get rating distribution
    const ratingStats = await prisma.review.groupBy({
      by: ['rating'],
      _count: {
        _all: true
      },
      where: { isVerified: true, isVisible: true }
    })

    return NextResponse.json({ 
      reviews, 
      stats: statusStats,
      ratingStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Reviews fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { id, isVerified, isVisible, moderatorNote } = data

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        isVerified,
        isVisible,
        updatedAt: new Date()
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    })

    // Recalculate product stats after updating review visibility
    await recalculateProductStats(updatedReview.productId)

    return NextResponse.json({ review: updatedReview })
  } catch (error) {
    console.error('Review update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 })
    }

    // Get the review before deleting to know which product to update
    const reviewToDelete = await prisma.review.findUnique({
      where: { id },
      select: { productId: true }
    })

    if (!reviewToDelete) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    await prisma.review.delete({
      where: { id }
    })

    // Recalculate product stats after deleting review
    await recalculateProductStats(reviewToDelete.productId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Review delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

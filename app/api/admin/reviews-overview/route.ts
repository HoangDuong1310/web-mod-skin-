import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageReviews } from '@/lib/auth-utils'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is admin
    if (!session?.user?.role || !canManageReviews(session.user.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get total reviews count
    const totalReviews = await prisma.review.count()

    // Get average rating
    const avgRating = await prisma.review.aggregate({
      _avg: {
        rating: true,
      },
    })

    // For now, we'll simulate pending and reported reviews
    // In a real app, you'd have proper status fields in your schema
    const pendingReviews = 0
    const reportedReviews = 0

    // Get rating distribution
    const ratingCounts = await prisma.review.groupBy({
      by: ['rating'],
      _count: {
        rating: true,
      },
    })

    // Convert to object format
    const ratingDistribution: Record<number, number> = {}
    ratingCounts.forEach(item => {
      ratingDistribution[item.rating] = item._count.rating
    })

    const overview = {
      totalReviews,
      averageRating: avgRating._avg.rating || 0,
      pendingReviews,
      reportedReviews,
      ratingDistribution,
    }

    return NextResponse.json(overview)
  } catch (error) {
    console.error('Reviews overview error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews overview' },
      { status: 500 }
    )
  }
}

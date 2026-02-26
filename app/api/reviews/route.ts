import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
// Rate limiting is disabled for now
// import { rateLimit } from '@/lib/rate-limit'
import { createReviewSchema, reviewQuerySchema } from '@/lib/validations'
import { checkReviewContent } from '@/lib/review-filter'
import { getSetting } from '@/lib/settings'

// Function to recalculate product rating and review count
async function recalculateProductStats(productId: string) {
  const visibleReviews = await prisma.review.findMany({
    where: {
      productId,
      isVerified: true,
      isVisible: true,
      deletedAt: null
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

// GET /api/reviews - Get reviews for a product
export async function GET(request: NextRequest) {
  try {
    // Rate limiting is disabled for now
    // const identifier = request.ip ?? 'anonymous'
    // const { success } = await rateLimit.limit(identifier)
    // if (!success) {
    //   return NextResponse.json(
    //     { error: 'Too many requests' },
    //     { status: 429 }
    //   )
    // }

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams)
    
    const {
      productId,
      page,
      limit,
      rating,
      sort,
    } = reviewQuerySchema.parse(query)

    const pageNum = page
    const limitNum = limit
    const offset = (pageNum - 1) * limitNum

    // Build where clause
    const where: any = {
      productId,
      isVisible: true,
      deletedAt: null,
    }

    if (rating) {
      where.rating = rating
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' }
    switch (sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' }
        break
      case 'highest':
        orderBy = { rating: 'desc' }
        break
      case 'lowest':
        orderBy = { rating: 'asc' }
        break
      default:
        orderBy = { createdAt: 'desc' }
    }

    // Get reviews with pagination
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          replies: {
            where: { isVisible: true },
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
          },
        },
        orderBy,
        skip: offset,
        take: limitNum,
      }),
      prisma.review.count({ where }),
    ])

    // Get rating distribution
    const ratingStats = await prisma.review.groupBy({
      by: ['rating'],
      where: {
        productId,
        isVisible: true,
        deletedAt: null,
      },
      _count: {
        rating: true,
      },
    })

    // Calculate average rating
    const avgRating = await prisma.review.aggregate({
      where: {
        productId,
        isVisible: true,
        deletedAt: null,
      },
      _avg: {
        rating: true,
      },
    })

    return NextResponse.json({
      reviews: reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        content: review.content,
        createdAt: review.createdAt,
        isVerified: review.isVerified,
        user: review.user ? {
          name: review.user.name,
          image: review.user.image,
        } : null,
        guestName: review.guestName,
        replies: (review as any).replies?.map((reply: any) => ({
          id: reply.id,
          content: reply.content,
          createdAt: reply.createdAt,
          user: {
            id: reply.user.id,
            name: reply.user.name,
            image: reply.user.image,
            role: reply.user.role,
          },
        })) || [],
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
      stats: {
        averageRating: avgRating._avg.rating || 0,
        totalReviews: total,
        distribution: ratingStats.reduce((acc, stat) => {
          acc[stat.rating] = stat._count.rating
          return acc
        }, {} as Record<number, number>),
      },
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: (error as any).issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    console.log('=== POST /api/reviews ===')
    
    // Rate limiting is disabled for now
    // const identifier = request.ip ?? 'anonymous'
    // const { success } = await rateLimit.limit(identifier)
    // if (!success) {
    //   return NextResponse.json(
    //     { error: 'Too many requests' },
    //     { status: 429 }
    //   )
    // }

    const session = await getServerSession(authOptions)
    console.log('Session:', session?.user?.email || 'No session')
    
    const body = await request.json()
    console.log('Request body:', body)
    
    // First validate the basic data structure
    const validation = createReviewSchema.safeParse(body)
    if (!validation.success) {
      console.log('Validation errors:', validation.error.issues)
      return NextResponse.json(
        { 
          error: 'Invalid review data',
          details: validation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      )
    }
    
    const {
      productId,
      rating,
      title,
      content,
      guestName,
      guestEmail,
    } = validation.data
    
    // Additional validation for guest reviews
    if (!session?.user?.id) {
      if (!guestName?.trim()) {
        return NextResponse.json(
          { error: 'Guest name is required' },
          { status: 400 }
        )
      }
      if (!guestEmail?.trim()) {
        return NextResponse.json(
          { error: 'Guest email is required' },
          { status: 400 }
        )
      }
    }
    
    console.log('Parsed data:', { productId, rating, title, content, guestName, guestEmail })

    // Verify product exists
    console.log('Checking if product exists with ID:', productId)
    const product = await prisma.product.findUnique({
      where: { id: productId, deletedAt: null },
    })
    console.log('Product found:', !!product)

    if (!product) {
      console.log('Product not found')
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if user already reviewed this product
    if (session?.user?.id) {
      const existingReview = await prisma.review.findFirst({
        where: {
          productId,
          userId: session.user.id,
          deletedAt: null,
        },
      })

      if (existingReview) {
        return NextResponse.json(
          { error: 'You have already reviewed this product' },
          { status: 400 }
        )
      }
    }

    // Check review content against filters
    const filterResult = await checkReviewContent(title, content, guestName, guestEmail)
    console.log('Filter result:', filterResult)

    if (filterResult.blocked) {
      return NextResponse.json(
        { 
          error: 'Nội dung review vi phạm quy tắc cộng đồng. Vui lòng chỉnh sửa và thử lại.',
          filterAction: 'block',
        },
        { status: 403 }
      )
    }

    // Determine visibility based on filter result
    const isAutoHidden = filterResult.action === 'hide'
    const isFlagged = filterResult.action === 'flag'

    // Check if all reviews require approval (pre-moderation)
    let requiresApproval = false
    const requireApprovalAll = await getSetting('review.requireApproval')
    const requireApprovalGuest = await getSetting('review.requireApprovalGuest')

    if (requireApprovalAll === true) {
      requiresApproval = true
    } else if (requireApprovalGuest === true && !session?.user?.id) {
      requiresApproval = true
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        productId,
        rating,
        title,
        content,
        userId: session?.user?.id || null,
        guestName: !session?.user?.id ? guestName : null,
        guestEmail: !session?.user?.id ? guestEmail : null,
        isVerified: !!session?.user?.id, // Verified if user is logged in
        isVisible: (isAutoHidden || requiresApproval) ? false : true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    // Update product average rating and review count
    await recalculateProductStats(productId)

    return NextResponse.json({
      review: {
        id: review.id,
        rating: review.rating,
        title: review.title,
        content: review.content,
        createdAt: review.createdAt,
        isVerified: review.isVerified,
        user: review.user ? {
          name: review.user.name,
          image: review.user.image,
        } : null,
        guestName: review.guestName,
      },
      ...(isAutoHidden && {
        notice: 'Review của bạn đang chờ duyệt bởi quản trị viên.',
        filterAction: 'hide',
      }),
      ...(!isAutoHidden && requiresApproval && {
        notice: 'Review của bạn đang chờ duyệt bởi quản trị viên.',
        filterAction: 'pending_approval',
      }),
      ...(isFlagged && {
        notice: 'Review của bạn đã được ghi nhận.',
        filterAction: 'flag',
      }),
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'Invalid review data', details: (error as any).issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiLimiter } from '@/lib/rate-limit'
import { productQuerySchema, createProductSchema } from '@/lib/validations'
import { slugify } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await apiLimiter(request)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      )
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams)
    
    const validatedQuery = productQuerySchema.parse(queryParams)
    const { page, limit, sort, order, q, categoryId, status, price_gte, price_lte, in_stock } = validatedQuery

    // Build where clause
    const where: any = {
      deletedAt: null,
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (status) {
      where.status = status
    }

    if (price_gte !== undefined || price_lte !== undefined) {
      where.price = {}
      if (price_gte !== undefined) where.price.gte = price_gte
      if (price_lte !== undefined) where.price.lte = price_lte
    }

    if (in_stock === true) {
      where.stock = { gt: 0 }
    } else if (in_stock === false) {
      where.stock = 0
    }

    // Build orderBy
    let orderBy: any = {}
    if (sort) {
      orderBy[sort] = order
    } else {
      orderBy = { createdAt: 'desc' }
    }

    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await apiLimiter(request)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createProductSchema.parse(body)

    // Convert images array to JSON string for database storage
    const dbData = {
      ...validatedData,
      images: validatedData.images ? JSON.stringify(validatedData.images) : null
    }

    // Generate slug if not provided
    if (!dbData.slug) {
      dbData.slug = slugify(dbData.title)
    }

    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug: dbData.slug }
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product with this slug already exists' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: dbData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    // Revalidate relevant paths
    const revalidateUrl = new URL('/api/revalidate', request.url)
    revalidateUrl.searchParams.set('secret', process.env.REVALIDATE_SECRET!)
    revalidateUrl.searchParams.set('path', '/products')
    
    try {
      await fetch(revalidateUrl.toString(), { method: 'POST' })
    } catch (revalidateError) {
      console.warn('Failed to revalidate:', revalidateError)
    }

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Create product error:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


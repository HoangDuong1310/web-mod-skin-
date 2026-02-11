import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageReviews } from '@/lib/auth-utils'

// GET /api/admin/review-filters - List all filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !canManageReviews(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')

    const where: any = {}

    if (type && type !== 'all') {
      where.type = type
    }

    if (isActive !== null && isActive !== 'all') {
      where.isActive = isActive === 'true'
    }

    if (search) {
      where.OR = [
        { value: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const skip = (page - 1) * limit

    const [filters, total] = await Promise.all([
      prisma.reviewFilter.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.reviewFilter.count({ where }),
    ])

    // Get stats
    const [totalFilters, activeFilters, keywordCount, urlCount, regexCount, emailCount] =
      await Promise.all([
        prisma.reviewFilter.count(),
        prisma.reviewFilter.count({ where: { isActive: true } }),
        prisma.reviewFilter.count({ where: { type: 'keyword' } }),
        prisma.reviewFilter.count({ where: { type: 'url' } }),
        prisma.reviewFilter.count({ where: { type: 'regex' } }),
        prisma.reviewFilter.count({ where: { type: 'email' } }),
      ])

    // Get total match count
    const matchStats = await prisma.reviewFilter.aggregate({
      _sum: { matchCount: true },
    })

    return NextResponse.json({
      filters,
      stats: {
        total: totalFilters,
        active: activeFilters,
        byType: {
          keyword: keywordCount,
          url: urlCount,
          regex: regexCount,
          email: emailCount,
        },
        totalMatches: matchStats._sum.matchCount || 0,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Review filters fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/review-filters - Create a new filter
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !canManageReviews(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { type, value, action, description, isActive } = data

    // Validate required fields
    if (!type || !value) {
      return NextResponse.json(
        { error: 'Type and value are required' },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes = ['keyword', 'url', 'regex', 'email']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate action
    const validActions = ['block', 'hide', 'flag']
    if (action && !validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate regex pattern if type is regex
    if (type === 'regex') {
      try {
        new RegExp(value)
      } catch {
        return NextResponse.json(
          { error: 'Invalid regex pattern' },
          { status: 400 }
        )
      }
    }

    // Check for duplicate
    const existing = await prisma.reviewFilter.findFirst({
      where: { type, value },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A filter with this type and value already exists' },
        { status: 409 }
      )
    }

    const filter = await prisma.reviewFilter.create({
      data: {
        type,
        value: value.trim(),
        action: action || 'block',
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json({ filter }, { status: 201 })
  } catch (error) {
    console.error('Review filter create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/review-filters - Update a filter
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !canManageReviews(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { id, type, value, action, description, isActive } = data

    if (!id) {
      return NextResponse.json({ error: 'Filter ID is required' }, { status: 400 })
    }

    const existing = await prisma.reviewFilter.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Filter not found' }, { status: 404 })
    }

    // Validate regex pattern if updating to regex type
    if ((type === 'regex' || (!type && existing.type === 'regex')) && value) {
      try {
        new RegExp(value)
      } catch {
        return NextResponse.json(
          { error: 'Invalid regex pattern' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (type !== undefined) updateData.type = type
    if (value !== undefined) updateData.value = value.trim()
    if (action !== undefined) updateData.action = action
    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.isActive = isActive

    const filter = await prisma.reviewFilter.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ filter })
  } catch (error) {
    console.error('Review filter update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/review-filters - Delete a filter
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Filter ID is required' }, { status: 400 })
    }

    const existing = await prisma.reviewFilter.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Filter not found' }, { status: 404 })
    }

    await prisma.reviewFilter.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Review filter delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

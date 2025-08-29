import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createTagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().max(200).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('🔵 Received tag data:', body)

    // Validate the request data
    const validation = createTagSchema.safeParse(body)
    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.issues)
      return NextResponse.json(
        { 
          error: 'Invalid tag data',
          details: validation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      )
    }

    const { name, slug, description } = validation.data

    // Check if slug already exists
    const existingTag = await prisma.tag.findUnique({
      where: { slug: slug }
    })

    if (existingTag) {
      return NextResponse.json(
        { error: 'A tag with this slug already exists' },
        { status: 400 }
      )
    }

    // Create the tag
    const tag = await prisma.tag.create({
      data: {
        name,
        slug,
        description: description || null,
      },
    })

    console.log('✅ Tag created successfully:', { id: tag.id, name: tag.name, slug: tag.slug })

    return NextResponse.json({
      tag: {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        description: tag.description,
      },
      message: 'Tag created successfully',
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error creating tag:', error)
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')

    const where: any = {
      deletedAt: null,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }

    const skip = (page - 1) * limit

    const [tags, total] = await Promise.all([
      prisma.tag.findMany({
        where,
        include: {
          _count: {
            select: {
              postTags: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
        skip,
        take: limit,
      }),
      prisma.tag.count({ where }),
    ])

    return NextResponse.json({
      tags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    })

  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { slugify } from '@/lib/utils'

const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z.string().optional(), // Allow empty, will auto-generate from title
  excerpt: z.string().max(300).optional(),
  content: z.string().min(1, 'Content is required'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  featured: z.boolean().default(false),
  featuredImage: z.string().url().optional().or(z.literal('')),
  publishedAt: z.string().datetime().optional().nullable(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  authorId: z.string().min(1),
  tags: z.array(z.string()).optional().default([]),
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
    console.log('🔵 Received post data:', body)

    // Validate the request data
    const validation = createPostSchema.safeParse(body)
    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.issues)
      return NextResponse.json(
        { 
          error: 'Invalid post data',
          details: validation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      )
    }

    const {
      title,
      excerpt,
      content,
      status,
      featured,
      featuredImage,
      publishedAt,
      metaTitle,
      metaDescription,
      tags,
    } = validation.data

    // Auto-generate slug if not provided or empty
    let slug = validation.data.slug?.trim()
    if (!slug) {
      slug = slugify(title)
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      )
    }

    // Check if slug already exists and generate unique one if needed
    let finalSlug = slug
    let counter = 1
    
    while (true) {
      const existingPost = await prisma.post.findUnique({
        where: { slug: finalSlug }
      })
      
      if (!existingPost) {
        break
      }
      
      finalSlug = `${slug}-${counter}`
      counter++
      
      // Prevent infinite loop
      if (counter > 100) {
        return NextResponse.json(
          { error: 'Unable to generate unique slug' },
          { status: 400 }
        )
      }
    }

    // Create the post
    const post = await prisma.post.create({
      data: {
        title,
        slug: finalSlug,
        excerpt: excerpt || null,
        content,
        status,
        featured,
        featuredImage: featuredImage || null,
        publishedAt: status === 'PUBLISHED' && publishedAt ? new Date(publishedAt) : null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // Add tags if provided
    if (tags.length > 0) {
      const tagConnections = tags.map(tagId => ({
        postId: post.id,
        tagId: tagId,
      }))

      await prisma.postTag.createMany({
        data: tagConnections,
        skipDuplicates: true,
      })
    }

    console.log('✅ Post created successfully:', { id: post.id, title: post.title, status: post.status })

    return NextResponse.json({
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        status: post.status,
        publishedAt: post.publishedAt,
      },
      message: `Post ${status === 'PUBLISHED' ? 'published' : 'saved'} successfully`,
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error creating post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const authorId = searchParams.get('authorId')

    const where: any = {
      deletedAt: null,
    }

    if (status) {
      where.status = status
    }

    if (authorId) {
      where.authorId = authorId
    }

    const skip = (page - 1) * limit

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              name: true,
              email: true,
            },
          },
          postTags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
    ])

    return NextResponse.json({
      posts,
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
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { z } from 'zod'

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['USER', 'STAFF', 'ADMIN']).default('USER'),
  image: z.string().url().optional().or(z.literal('')),
  sendWelcomeEmail: z.boolean().default(true),
  requireEmailVerification: z.boolean().default(false),
  forcePasswordChange: z.boolean().default(true),
})

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(['USER', 'STAFF', 'ADMIN']).optional(),
  image: z.string().url().optional().or(z.literal('')),
  emailVerified: z.boolean().optional(),
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

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can create users' },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('🔵 Received user data:', { ...body, password: '[HIDDEN]' })

    // Validate the request data
    const validation = createUserSchema.safeParse(body)
    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.issues)
      return NextResponse.json(
        { 
          error: 'Invalid user data',
          details: validation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      )
    }

    const {
      name,
      email,
      password,
      role,
      image,
      sendWelcomeEmail,
      requireEmailVerification,
      forcePasswordChange,
    } = validation.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        image: image || null,
        emailVerified: !requireEmailVerification ? new Date() : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        emailVerified: true,
        createdAt: true,
      },
    })

    // TODO: Send welcome email if enabled
    if (sendWelcomeEmail) {
      console.log('📧 Would send welcome email to:', user.email)
    }

    console.log('✅ User created successfully:', { id: user.id, email: user.email, role: user.role })

    return NextResponse.json({
      user,
      message: 'User created successfully',
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can view user list' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')
    const role = searchParams.get('role')

    const where: any = {
      deletedAt: null,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (role) {
      where.role = role
    }

    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          _count: {
            select: {
              downloads: true,
              reviews: true,
              posts: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      users,
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
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}


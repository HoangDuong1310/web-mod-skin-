import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// Schema validation for creating/updating banners
const bannerSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  content: z.string().optional(),
  linkUrl: z.string().url().optional().nullable(),
  linkText: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  backgroundColor: z.string().optional().nullable(),
  textColor: z.string().optional().nullable(),
  type: z.enum(['INFO', 'LIVESTREAM', 'PROMOTION', 'WARNING', 'SUCCESS', 'EVENT']).default('INFO'),
  position: z.enum(['TOP', 'BOTTOM', 'MODAL']).default('TOP'),
  isActive: z.boolean().default(true),
  isDismissible: z.boolean().default(true),
  showOnMobile: z.boolean().default(true),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  priority: z.number().int().default(0),
  targetAudience: z.enum(['ALL', 'AUTHENTICATED', 'GUEST']).default('ALL'),
  appVisible: z.boolean().default(true),
  appData: z.string().optional().nullable(),
})

// GET: Lấy danh sách banners (public - lấy active banners, admin - lấy tất cả)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isAdmin = searchParams.get('mode') === 'manage' // Changed from 'admin=true' to avoid ad blocker
    const appOnly = searchParams.get('app') === 'true' // For mobile app
    const position = searchParams.get('position')
    const type = searchParams.get('type')

    // Check admin permission
    if (isAdmin) {
      const session = await getServerSession(authOptions)
      if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Admin: return all banners with pagination
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const skip = (page - 1) * limit

      const [banners, total] = await Promise.all([
        prisma.banner.findMany({
          where: { deletedAt: null },
          orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
          skip,
          take: limit,
        }),
        prisma.banner.count({ where: { deletedAt: null } }),
      ])

      return NextResponse.json({
        banners,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    }

    // Public: return only active banners
    const now = new Date()
    const whereClause: any = {
      isActive: true,
      deletedAt: null,
      OR: [
        { startDate: null },
        { startDate: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
      ],
    }

    // Filter for mobile app
    if (appOnly) {
      whereClause.appVisible = true
    }

    // Filter by position
    if (position) {
      whereClause.position = position.toUpperCase()
    }

    // Filter by type
    if (type) {
      whereClause.type = type.toUpperCase()
    }

    const banners = await prisma.banner.findMany({
      where: whereClause,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        content: true,
        linkUrl: true,
        linkText: true,
        imageUrl: true,
        backgroundColor: true,
        textColor: true,
        type: true,
        position: true,
        isDismissible: true,
        showOnMobile: true,
        targetAudience: true,
        priority: true,
        appVisible: true,
        appData: true,
        startDate: true,
        endDate: true,
      },
    })

    return NextResponse.json({ banners })
  } catch (error) {
    console.error('Error fetching banners:', error)
    return NextResponse.json(
      { error: 'Không thể lấy danh sách banner' },
      { status: 500 }
    )
  }
}

// POST: Tạo banner mới (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = bannerSchema.parse(body)

    const banner = await prisma.banner.create({
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      },
    })

    return NextResponse.json({ banner, message: 'Tạo banner thành công' }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating banner:', error)
    return NextResponse.json(
      { error: 'Không thể tạo banner' },
      { status: 500 }
    )
  }
}

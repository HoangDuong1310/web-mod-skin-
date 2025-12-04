import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// Schema validation for updating banners
const updateBannerSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional().nullable(),
  linkUrl: z.string().url().optional().nullable(),
  linkText: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  backgroundColor: z.string().optional().nullable(),
  textColor: z.string().optional().nullable(),
  type: z.enum(['INFO', 'LIVESTREAM', 'PROMOTION', 'WARNING', 'SUCCESS', 'EVENT']).optional(),
  position: z.enum(['TOP', 'BOTTOM', 'MODAL']).optional(),
  isActive: z.boolean().optional(),
  isDismissible: z.boolean().optional(),
  showOnMobile: z.boolean().optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  priority: z.number().int().optional(),
  targetAudience: z.enum(['ALL', 'AUTHENTICATED', 'GUEST']).optional(),
  appVisible: z.boolean().optional(),
  appData: z.string().optional().nullable(),
})

// GET: Lấy chi tiết một banner
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const banner = await prisma.banner.findUnique({
      where: { id: params.id, deletedAt: null },
    })

    if (!banner) {
      return NextResponse.json({ error: 'Banner không tồn tại' }, { status: 404 })
    }

    return NextResponse.json({ banner })
  } catch (error) {
    console.error('Error fetching banner:', error)
    return NextResponse.json(
      { error: 'Không thể lấy thông tin banner' },
      { status: 500 }
    )
  }
}

// PATCH: Cập nhật banner (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const banner = await prisma.banner.findUnique({
      where: { id: params.id, deletedAt: null },
    })

    if (!banner) {
      return NextResponse.json({ error: 'Banner không tồn tại' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateBannerSchema.parse(body)

    const updatedBanner = await prisma.banner.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        startDate: validatedData.startDate !== undefined
          ? (validatedData.startDate ? new Date(validatedData.startDate) : null)
          : undefined,
        endDate: validatedData.endDate !== undefined
          ? (validatedData.endDate ? new Date(validatedData.endDate) : null)
          : undefined,
      },
    })

    return NextResponse.json({ banner: updatedBanner, message: 'Cập nhật banner thành công' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating banner:', error)
    return NextResponse.json(
      { error: 'Không thể cập nhật banner' },
      { status: 500 }
    )
  }
}

// DELETE: Xóa banner (soft delete, Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const banner = await prisma.banner.findUnique({
      where: { id: params.id, deletedAt: null },
    })

    if (!banner) {
      return NextResponse.json({ error: 'Banner không tồn tại' }, { status: 404 })
    }

    // Soft delete
    await prisma.banner.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ message: 'Xóa banner thành công' })
  } catch (error) {
    console.error('Error deleting banner:', error)
    return NextResponse.json(
      { error: 'Không thể xóa banner' },
      { status: 500 }
    )
  }
}

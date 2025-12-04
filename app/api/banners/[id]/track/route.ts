import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST: Track banner interactions (views, clicks)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { action } = body // 'view' or 'click'

    if (!['view', 'click'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "view" or "click"' },
        { status: 400 }
      )
    }

    const banner = await prisma.banner.findUnique({
      where: { id: params.id, deletedAt: null },
    })

    if (!banner) {
      return NextResponse.json({ error: 'Banner không tồn tại' }, { status: 404 })
    }

    // Update stats
    if (action === 'view') {
      await prisma.banner.update({
        where: { id: params.id },
        data: { viewCount: { increment: 1 } },
      })
    } else if (action === 'click') {
      await prisma.banner.update({
        where: { id: params.id },
        data: { clickCount: { increment: 1 } },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking banner:', error)
    return NextResponse.json(
      { error: 'Không thể cập nhật thống kê' },
      { status: 500 }
    )
  }
}

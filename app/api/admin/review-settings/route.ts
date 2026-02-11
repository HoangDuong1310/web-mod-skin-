import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageReviews } from '@/lib/auth-utils'
import { getSetting, setSetting } from '@/lib/settings'

// Review settings keys
const REVIEW_SETTINGS = {
  requireApproval: 'review.requireApproval',
  requireApprovalGuest: 'review.requireApprovalGuest',
}

// GET /api/admin/review-settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !canManageReviews(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requireApproval = await getSetting(REVIEW_SETTINGS.requireApproval)
    const requireApprovalGuest = await getSetting(REVIEW_SETTINGS.requireApprovalGuest)

    return NextResponse.json({
      requireApproval: requireApproval === true,
      requireApprovalGuest: requireApprovalGuest === true,
    })
  } catch (error) {
    console.error('Error fetching review settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/review-settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !canManageReviews(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { requireApproval, requireApprovalGuest } = body

    if (typeof requireApproval === 'boolean') {
      await setSetting(REVIEW_SETTINGS.requireApproval, requireApproval, 'review')
    }

    if (typeof requireApprovalGuest === 'boolean') {
      await setSetting(REVIEW_SETTINGS.requireApprovalGuest, requireApprovalGuest, 'review')
    }

    // Return updated settings
    const updatedRequireApproval = await getSetting(REVIEW_SETTINGS.requireApproval)
    const updatedRequireApprovalGuest = await getSetting(REVIEW_SETTINGS.requireApprovalGuest)

    return NextResponse.json({
      requireApproval: updatedRequireApproval === true,
      requireApprovalGuest: updatedRequireApprovalGuest === true,
      message: 'Cập nhật cài đặt thành công',
    })
  } catch (error) {
    console.error('Error updating review settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageReviews } from '@/lib/auth-utils'
import { checkReviewContent } from '@/lib/review-filter'

// POST /api/admin/review-filters/test - Test content against filters
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !canManageReviews(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { title, content, guestName, guestEmail } = data

    if (!title && !content) {
      return NextResponse.json(
        { error: 'Title or content is required for testing' },
        { status: 400 }
      )
    }

    const result = await checkReviewContent(
      title || '',
      content || '',
      guestName,
      guestEmail
    )

    return NextResponse.json({ result })
  } catch (error) {
    console.error('Filter test error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

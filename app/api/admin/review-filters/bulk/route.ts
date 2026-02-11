import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageReviews } from '@/lib/auth-utils'

// POST /api/admin/review-filters/bulk - Bulk import filters
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !canManageReviews(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { filters } = data

    if (!Array.isArray(filters) || filters.length === 0) {
      return NextResponse.json(
        { error: 'Filters array is required and must not be empty' },
        { status: 400 }
      )
    }

    if (filters.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 filters can be imported at once' },
        { status: 400 }
      )
    }

    const validTypes = ['keyword', 'url', 'regex', 'email']
    const validActions = ['block', 'hide', 'flag']

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const filter of filters) {
      try {
        if (!filter.type || !filter.value) {
          results.errors.push(`Missing type or value: ${JSON.stringify(filter)}`)
          results.skipped++
          continue
        }

        if (!validTypes.includes(filter.type)) {
          results.errors.push(`Invalid type "${filter.type}" for value "${filter.value}"`)
          results.skipped++
          continue
        }

        if (filter.action && !validActions.includes(filter.action)) {
          results.errors.push(`Invalid action "${filter.action}" for value "${filter.value}"`)
          results.skipped++
          continue
        }

        // Check duplicate
        const existing = await prisma.reviewFilter.findFirst({
          where: { type: filter.type, value: filter.value },
        })

        if (existing) {
          results.skipped++
          continue
        }

        await prisma.reviewFilter.create({
          data: {
            type: filter.type,
            value: filter.value.trim(),
            action: filter.action || 'block',
            description: filter.description || null,
            isActive: filter.isActive !== undefined ? filter.isActive : true,
            createdBy: session.user.id,
          },
        })

        results.created++
      } catch (err) {
        results.errors.push(`Failed to create filter "${filter.value}": ${err}`)
        results.skipped++
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('Bulk filter import error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

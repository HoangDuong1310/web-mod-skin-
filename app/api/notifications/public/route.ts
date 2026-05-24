/**
 * API Route: /api/notifications/public
 * Public endpoint for the Ainz client to fetch active notifications.
 *
 * Method: GET
 * Auth: None (public broadcasts)
 *
 * Returns active, non-deleted notifications targeted to ALL users,
 * filtered by their start/end date window.
 *
 * The Pengu plugin polls this endpoint when the League client launches
 * and displays the results as in-client banners.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()

    // Cast to any until prisma generate runs (notifications model exists)
    const notifications = await (prisma as any).notifications.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        // Only ALL audience (we don't have logged-in context in the plugin)
        targetAudience: 'ALL',
        // startDate: NULL OR <= now
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        // endDate: NULL OR >= now (combine via AND in additional filter)
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        position: true,
        priority: true,
        dismissible: true,
        linkUrl: true,
        linkText: true,
        createdAt: true,
      },
      take: 20,
    })

    return NextResponse.json(
      { notifications },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=60', // 1-minute cache
        },
      }
    )
  } catch (error) {
    console.error('Notifications public fetch error:', error)
    return NextResponse.json(
      { notifications: [], error: 'SERVER_ERROR' },
      {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    )
  }
}

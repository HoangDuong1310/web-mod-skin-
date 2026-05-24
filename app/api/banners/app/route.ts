/**
 * API Route: /api/banners/app
 * Public endpoint for the Ainz client to fetch active app banners.
 *
 * Method: GET
 * Auth: None (public broadcasts)
 *
 * Returns active banners where appVisible=true, filtered by start/end window
 * and targetAudience=ALL. The Ainz client's Pengu plugin polls this endpoint
 * and displays the highest-priority banner as a single centered modal.
 *
 * Uses the existing Banner model (purpose-built with appVisible + appData fields).
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()

    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        appVisible: true,
        deletedAt: null,
        targetAudience: 'ALL',
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
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        position: true,
        priority: true,
        isDismissible: true,
        linkUrl: true,
        linkText: true,
        imageUrl: true,
        backgroundColor: true,
        textColor: true,
        appData: true,
        createdAt: true,
      },
      take: 10,
    })

    return NextResponse.json(
      { banners },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=60',
        },
      }
    )
  } catch (error) {
    console.error('App banners fetch error:', error)
    return NextResponse.json(
      { banners: [], error: 'SERVER_ERROR' },
      {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    )
  }
}

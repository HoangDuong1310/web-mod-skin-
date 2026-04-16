/**
 * API Route: /api/admin/live-users
 * Get list of currently online users with real-time status
 * Method: GET
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'STAFF'].includes((session.user as any)?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Users with heartbeat in last 5 minutes are "online"
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const users = await prisma.activeSession.findMany({
      where: { lastHeartbeat: { gte: fiveMinutesAgo } },
      orderBy: { lastHeartbeat: 'desc' },
    })

    // Mask sensitive data
    const masked = users.map((u) => ({
      ...u,
      licenseKey: u.licenseKey.substring(0, 9) + '****',
      hwid: u.hwid.substring(0, 8) + '****',
    }))

    return NextResponse.json({
      total: masked.length,
      users: masked,
    })
  } catch (error) {
    console.error('Live users API error:', error)
    return NextResponse.json(
      { error: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}

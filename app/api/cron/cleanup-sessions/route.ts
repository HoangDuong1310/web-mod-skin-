/**
 * API Route: /api/cron/cleanup-sessions
 * Cron job dọn dẹp phiên hết hạn (stale sessions) trên toàn hệ thống
 * 
 * Chạy mỗi 5 phút để đảm bảo session hết hạn được dọn dẹp kịp thời,
 * giải phóng slot cho người dùng khác.
 * 
 * Extended: Also cleans up expired active_sessions and moves to session_history
 * 
 * Có thể gọi bằng:
 * - Vercel Cron (vercel.json)
 * - External cron service
 * - Manual call với API key
 */

import { NextResponse } from 'next/server'
import { cleanupAllStaleSessions, SESSION_TIMEOUT_MS, SESSION_GRACE_MS } from '@/lib/license-key'
import { prisma } from '@/lib/prisma'

const CRON_API_KEY = process.env.CRON_API_KEY

export async function GET(request: Request) {
  try {
    // Verify API key if configured
    if (CRON_API_KEY) {
      const authHeader = request.headers.get('authorization')
      const apiKey = authHeader?.replace('Bearer ', '')

      if (apiKey !== CRON_API_KEY) {
        return NextResponse.json(
          { error: 'Unauthorized - Invalid API key' },
          { status: 401 }
        )
      }
    }

    const result = await cleanupAllStaleSessions()

    // Clean up expired active_sessions (no heartbeat in 5 minutes)
    let activeSessionsCleaned = 0
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

      // Get expired sessions before deleting (for history)
      const expired = await prisma.activeSession.findMany({
        where: { lastHeartbeat: { lt: fiveMinutesAgo } },
      })

      // Move to session_history
      if (expired.length > 0) {
        await prisma.sessionHistory.createMany({
          data: expired.map((s) => ({
            licenseKey: s.licenseKey,
            hwid: s.hwid,
            summonerName: s.summonerName,
            region: s.region,
            sessionStart: s.sessionStart,
            sessionEnd: s.lastHeartbeat,
            durationMinutes: s.uptimeMinutes,
            injectionCount: s.injectionCount,
            appVersion: s.appVersion,
          })),
        })
      }

      // Delete expired active sessions
      const deleted = await prisma.activeSession.deleteMany({
        where: { lastHeartbeat: { lt: fiveMinutesAgo } },
      })
      activeSessionsCleaned = deleted.count
    } catch (trackingCleanupError) {
      console.error('Active session cleanup error:', trackingCleanupError)
    }

    console.log(
      `[Session Cleanup Cron] ${new Date().toISOString()} - ` +
      `Cleaned ${result.cleanedSessions} stale sessions from ${result.affectedKeys} keys, ` +
      `${activeSessionsCleaned} expired active tracking sessions`
    )

    return NextResponse.json({
      success: true,
      message: 'Session cleanup completed',
      data: {
        cleanedSessions: result.cleanedSessions,
        affectedKeys: result.affectedKeys,
        activeSessionsCleaned,
        timeoutConfig: {
          sessionTimeoutMs: SESSION_TIMEOUT_MS,
          graceMs: SESSION_GRACE_MS,
          totalTimeoutMs: SESSION_TIMEOUT_MS + SESSION_GRACE_MS,
        },
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Session cleanup cron error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}

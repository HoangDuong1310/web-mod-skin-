/**
 * API Route: /api/cron/cleanup-sessions
 * Cron job dọn dẹp phiên hết hạn (stale sessions) trên toàn hệ thống
 * 
 * Chạy mỗi 5 phút để đảm bảo session hết hạn được dọn dẹp kịp thời,
 * giải phóng slot cho người dùng khác.
 * 
 * Có thể gọi bằng:
 * - Vercel Cron (vercel.json)
 * - External cron service
 * - Manual call với API key
 */

import { NextResponse } from 'next/server'
import { cleanupAllStaleSessions, SESSION_TIMEOUT_MS, SESSION_GRACE_MS } from '@/lib/license-key'

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

    console.log(
      `[Session Cleanup Cron] ${new Date().toISOString()} - ` +
      `Cleaned ${result.cleanedSessions} stale sessions from ${result.affectedKeys} keys`
    )

    return NextResponse.json({
      success: true,
      message: 'Session cleanup completed',
      data: {
        cleanedSessions: result.cleanedSessions,
        affectedKeys: result.affectedKeys,
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

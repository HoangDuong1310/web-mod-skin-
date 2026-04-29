/**
 * API Route: /api/admin/live-stats
 * Get aggregated statistics of currently online users
 * Method: GET
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'STAFF'].includes((session.user as any)?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const users = await prisma.activeSession.findMany({
      where: { lastHeartbeat: { gte: fiveMinutesAgo } },
    })

    // Aggregate stats
    const byPhase: Record<string, number> = {}
    const byGameMode: Record<string, number> = {}
    const byRegion: Record<string, number> = {}
    const byVersion: Record<string, number> = {}
    const championCounts: Record<string, number> = {}
    const skinCounts: Record<string, number> = {}
    let inGameCount = 0
    let inLobbyCount = 0

    for (const u of users) {
      const phase = u.phase || 'Idle'
      byPhase[phase] = (byPhase[phase] || 0) + 1

      if (phase === 'InProgress') inGameCount++
      if (phase === 'Lobby') inLobbyCount++

      if (u.gameMode) {
        byGameMode[u.gameMode] = (byGameMode[u.gameMode] || 0) + 1
      }
      if (u.region) {
        byRegion[u.region] = (byRegion[u.region] || 0) + 1
      }
      if (u.appVersion) {
        byVersion[u.appVersion] = (byVersion[u.appVersion] || 0) + 1
      }
      if (u.champion) {
        championCounts[u.champion] = (championCounts[u.champion] || 0) + 1
      }
      if (u.skin) {
        skinCounts[u.skin] = (skinCounts[u.skin] || 0) + 1
      }
    }

    const topChampions = Object.entries(championCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))

    const topSkins = Object.entries(skinCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))

    return NextResponse.json({
      onlineCount: users.length,
      inGameCount,
      inLobbyCount,
      idleCount: users.length - inGameCount - inLobbyCount,
      byPhase,
      byGameMode,
      byRegion,
      byVersion,
      topChampions,
      topSkins,
      totalInjections: users.reduce((sum, u) => sum + u.injectionCount, 0),
    })
  } catch (error) {
    console.error('Live stats API error:', error)
    return NextResponse.json(
      { error: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}

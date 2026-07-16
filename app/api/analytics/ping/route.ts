import { createHash } from 'crypto'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const MAX_MACHINE_ID_LENGTH = 256
const MAX_TEXT_LENGTH = 160

function optionalText(value: unknown, maxLength = MAX_TEXT_LENGTH): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized ? normalized.slice(0, maxLength) : null
}

function optionalInteger(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null
}

function nonNegativeInteger(value: unknown): number {
  const parsed = optionalInteger(value)
  return parsed === null ? 0 : Math.max(0, parsed)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const machineId = optionalText(body?.machine_id, MAX_MACHINE_ID_LENGTH)

    if (!machineId) {
      return NextResponse.json(
        { success: false, error: 'MISSING_MACHINE_ID' },
        { status: 400 }
      )
    }

    const status = body?.status && typeof body.status === 'object' ? body.status : {}
    const machineHash = createHash('sha256').update(machineId).digest('hex')
    const anonymousKey = `FREE-${machineHash.slice(0, 27).toUpperCase()}`
    const now = new Date()

    await prisma.activeSession.upsert({
      where: {
        licenseKey_hwid: {
          licenseKey: anonymousKey,
          hwid: machineHash,
        },
      },
      create: {
        licenseKey: anonymousKey,
        hwid: machineHash,
        appVersion: optionalText(body?.app_version, 64),
        phase: optionalText(status.phase, 64),
        gameMode: optionalText(status.game_mode, 64),
        champion: optionalText(status.champion),
        championId: optionalInteger(status.champion_id),
        skin: optionalText(status.skin),
        skinId: optionalInteger(status.skin_id),
        summonerName: optionalText(status.summoner_name),
        region: optionalText(status.region, 32),
        partyMode: Boolean(status.party_mode),
        uptimeMinutes: nonNegativeInteger(status.uptime_minutes),
        injectionCount: nonNegativeInteger(status.injection_count),
        lastInjectionSkin: optionalText(status.last_injection_skin),
        sessionStart: now,
        lastHeartbeat: now,
      },
      update: {
        appVersion: optionalText(body?.app_version, 64),
        phase: optionalText(status.phase, 64),
        gameMode: optionalText(status.game_mode, 64),
        champion: optionalText(status.champion),
        championId: optionalInteger(status.champion_id),
        skin: optionalText(status.skin),
        skinId: optionalInteger(status.skin_id),
        summonerName: optionalText(status.summoner_name),
        region: optionalText(status.region, 32),
        partyMode: Boolean(status.party_mode),
        uptimeMinutes: nonNegativeInteger(status.uptime_minutes),
        injectionCount: nonNegativeInteger(status.injection_count),
        lastInjectionSkin: optionalText(status.last_injection_skin),
        lastHeartbeat: now,
      },
    })

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  } catch (error) {
    console.error('Analytics ping error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * API Route: /api/license/heartbeat
 * App gọi định kỳ để xác nhận vẫn đang sử dụng
 * Method: POST
 *
 * Extended: Supports optional `status` field for real-time user tracking
 */

import { NextResponse } from 'next/server'
import { heartbeat, isValidKeyFormat, normalizeKey } from '@/lib/license-key'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { key, hwid, status } = body
    
    // Validate input
    if (!key || !hwid) {
      return NextResponse.json(
        { valid: false, error: 'MISSING_PARAMS' },
        { status: 400 }
      )
    }
    
    // Validate key format
    const normalizedKey = normalizeKey(key)
    if (!isValidKeyFormat(normalizedKey)) {
      return NextResponse.json(
        { valid: false, error: 'INVALID_FORMAT' },
        { status: 400 }
      )
    }
    
    // Get client info
    const headersList = headers()
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] ||
                      headersList.get('x-real-ip') ||
                      'unknown'
    
    // Heartbeat
    const result = await heartbeat({
      key: normalizedKey,
      hwid,
      ipAddress,
    })
    
    if (!result.valid) {
      // SESSION_EXPIRED trả về 410 Gone - client cần re-activate
      const statusCode = result.error === 'SESSION_EXPIRED' ? 410 : 401
      return NextResponse.json(
        { valid: false, error: result.error, message: (result as any).message },
        { status: statusCode }
      )
    }

    // Real-time tracking: UPSERT active_sessions if status field present
    if (status && typeof status === 'object') {
      try {
        await prisma.activeSession.upsert({
          where: {
            licenseKey_hwid: {
              licenseKey: normalizedKey,
              hwid,
            },
          },
          create: {
            licenseKey: normalizedKey,
            hwid,
            appVersion: status.app_version || null,
            phase: status.phase || null,
            gameMode: status.game_mode || null,
            champion: status.champion || null,
            championId: status.champion_id != null ? Number(status.champion_id) : null,
            skin: status.skin || null,
            skinId: status.skin_id != null ? Number(status.skin_id) : null,
            summonerName: status.summoner_name || null,
            region: status.region || null,
            partyMode: Boolean(status.party_mode),
            uptimeMinutes: Number(status.uptime_minutes) || 0,
            injectionCount: Number(status.injection_count) || 0,
            lastInjectionSkin: status.last_injection_skin || null,
            sessionStart: new Date(),
            lastHeartbeat: new Date(),
          },
          update: {
            appVersion: status.app_version || null,
            phase: status.phase || null,
            gameMode: status.game_mode || null,
            champion: status.champion || null,
            championId: status.champion_id != null ? Number(status.champion_id) : null,
            skin: status.skin || null,
            skinId: status.skin_id != null ? Number(status.skin_id) : null,
            summonerName: status.summoner_name || null,
            region: status.region || null,
            partyMode: Boolean(status.party_mode),
            uptimeMinutes: Number(status.uptime_minutes) || 0,
            injectionCount: Number(status.injection_count) || 0,
            lastInjectionSkin: status.last_injection_skin || null,
            lastHeartbeat: new Date(),
          },
        })
      } catch (trackingError) {
        // Don't fail the heartbeat if tracking fails
        console.error('Active session tracking error:', trackingError)
      }
    }
    
    return NextResponse.json({
      valid: true,
      data: result.data,
    })
  } catch (error) {
    console.error('License heartbeat error:', error)
    return NextResponse.json(
      { valid: false, error: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}

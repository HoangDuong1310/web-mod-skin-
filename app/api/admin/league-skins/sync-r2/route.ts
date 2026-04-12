import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { listR2Objects, getLeagueSkinR2Key } from '@/lib/r2'
import { R2_PREFIXES } from '@/lib/r2'

/**
 * POST /api/admin/league-skins/sync-r2
 * Scan R2 storage and sync file info to DB
 * - Finds files on R2 that DB doesn't know about
 * - Updates DB records with correct fileUrl, fileSize
 * - Also detects files in DB that no longer exist on R2
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. List all files on R2 under league-skins/skins/
    const r2Files = await listR2Objects(`${R2_PREFIXES.LEAGUE_SKINS}/skins/`)

    // Build a map: skinId -> { key, size }
    // Parse both nested formats:
    //   league-skins/skins/{champId}/{skinId}/{skinId}.zip (main skin)
    //   league-skins/skins/{champId}/{parentId}/{skinId}/{skinId}.zip (chroma)
    const r2Map = new Map<number, { key: string; size: number }>()

    for (const file of r2Files) {
      // Try chroma format first: league-skins/skins/{champ}/{parent}/{skin}/{skin}.zip
      const chromaMatch = file.key.match(
        /^league-skins\/skins\/\d+\/\d+\/(\d+)\/\d+\.zip$/
      )
      if (chromaMatch) {
        r2Map.set(parseInt(chromaMatch[1]), file)
        continue
      }

      // Main skin format: league-skins/skins/{champ}/{skin}/{skin}.zip
      const mainMatch = file.key.match(
        /^league-skins\/skins\/\d+\/(\d+)\/\d+\.zip$/
      )
      if (mainMatch) {
        r2Map.set(parseInt(mainMatch[1]), file)
      }
    }

    // 2. Get all skins from DB
    const dbSkins = await prisma.leagueSkin.findMany({
      select: {
        skinId: true,
        championId: true,
        fileUrl: true,
        fileSize: true,
        parentSkinId: true,
        isChroma: true,
      },
    })

    let synced = 0
    let removed = 0
    let alreadyOk = 0
    const errors: string[] = []

    for (const skin of dbSkins) {
      const r2File = r2Map.get(skin.skinId)
      const expectedKey = getLeagueSkinR2Key(
        skin.championId,
        skin.skinId,
        skin.parentSkinId
      )

      if (r2File) {
        // File exists on R2
        if (skin.fileUrl !== r2File.key || skin.fileSize !== r2File.size) {
          // DB is out of sync - update it
          try {
            await prisma.leagueSkin.update({
              where: { skinId: skin.skinId },
              data: {
                fileUrl: r2File.key,
                fileSize: r2File.size,
              },
            })
            synced++
          } catch (err) {
            errors.push(`Failed to update skin ${skin.skinId}: ${err}`)
          }
        } else {
          alreadyOk++
        }
      } else if (skin.fileUrl) {
        // DB says file exists but R2 doesn't have it - clear DB
        try {
          await prisma.leagueSkin.update({
            where: { skinId: skin.skinId },
            data: {
              fileUrl: null,
              fileSize: null,
              fileHash: null,
            },
          })
          removed++
        } catch (err) {
          errors.push(`Failed to clear skin ${skin.skinId}: ${err}`)
        }
      } else {
        alreadyOk++
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        r2Files: r2Files.length,
        dbSkins: dbSkins.length,
        synced,
        removed,
        alreadyOk,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors.slice(0, 20) : undefined,
    })
  } catch (error) {
    console.error('Error syncing R2 to DB:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

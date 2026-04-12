import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const CDRAGON_SKINS_URL =
  'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/skins.json'
const CDRAGON_CHAMPIONS_URL =
  'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json'

interface CDragonSkin {
  id: number
  name: string
  isBase: boolean
  splashPath: string
  chromas?: { id: number; name: string }[]
}

interface CDragonChampion {
  id: number
  name: string
  alias: string
}

// GET - Fetch latest data from CommunityDragon and compare with DB
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch from CommunityDragon
    const [skinsRes, championsRes] = await Promise.all([
      fetch(CDRAGON_SKINS_URL, { next: { revalidate: 0 } }),
      fetch(CDRAGON_CHAMPIONS_URL, { next: { revalidate: 0 } }),
    ])

    if (!skinsRes.ok || !championsRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch from CommunityDragon' },
        { status: 502 }
      )
    }

    const [cdragonSkinsRaw, cdragonChampionsRaw] = await Promise.all([
      skinsRes.json() as Promise<Record<string, CDragonSkin>>,
      championsRes.json() as Promise<CDragonChampion[]>,
    ])

    // Build champion map from CommunityDragon
    const cdragonChampions = new Map<number, string>()
    for (const champ of cdragonChampionsRaw) {
      if (champ.id > 0) {
        cdragonChampions.set(champ.id, champ.name)
      }
    }

    // Build skin list from CommunityDragon (exclude base skins id % 1000 === 0)
    const cdragonSkins: {
      skinId: number
      championId: number
      name: string
      isBase: boolean
      isChroma: boolean
      parentSkinId: number | null
      splashUrl: string | null
    }[] = []

    for (const [skinIdStr, skin] of Object.entries(cdragonSkinsRaw)) {
      const skinId = parseInt(skinIdStr)
      if (isNaN(skinId)) continue

      const championId = Math.floor(skinId / 1000)
      const splashUrl = skin.splashPath
        ? `https://cdn.communitydragon.org/latest/champion/${championId}/splash-art/skin/${skinId % 1000}`
        : null

      cdragonSkins.push({
        skinId,
        championId,
        name: skin.name,
        isBase: skin.isBase || skinId % 1000 === 0,
        isChroma: false,
        parentSkinId: null,
        splashUrl,
      })

      // Include chromas (nested under parent skin)
      if (skin.chromas) {
        for (const chroma of skin.chromas) {
          cdragonSkins.push({
            skinId: chroma.id,
            championId,
            name: chroma.name,
            isBase: false,
            isChroma: true,
            parentSkinId: skinId,
            splashUrl: null,
          })
        }
      }
    }

    // Get existing data from DB
    const [dbChampions, dbSkins] = await Promise.all([
      prisma.leagueChampion.findMany({
        select: { championId: true, nameEn: true },
      }),
      prisma.leagueSkin.findMany({
        select: { skinId: true, nameEn: true, fileUrl: true, isActive: true, championId: true },
      }),
    ])

    const dbChampionSet = new Set(dbChampions.map((c) => c.championId))
    const dbSkinMap = new Map(dbSkins.map((s) => [s.skinId, s]))

    // Compare: find new skins not in DB
    const newSkins = cdragonSkins.filter((s) => !dbSkinMap.has(s.skinId) && !s.isBase)
    const existingSkins = cdragonSkins.filter((s) => dbSkinMap.has(s.skinId) && !s.isBase)

    // Find skins in DB that have files
    const skinsWithFiles = dbSkins.filter((s) => s.fileUrl)
    const skinsWithoutFiles = existingSkins.filter((s) => {
      const db = dbSkinMap.get(s.skinId)
      return db && !db.fileUrl
    })

    // Group new skins by champion
    const newSkinsByChampion = new Map<number, typeof newSkins>()
    for (const skin of newSkins) {
      const list = newSkinsByChampion.get(skin.championId) || []
      list.push(skin)
      newSkinsByChampion.set(skin.championId, list)
    }

    const newChampions = Array.from(cdragonChampions.entries())
      .filter(([id]) => !dbChampionSet.has(id))
      .map(([id, name]) => ({ championId: id, name }))

    return NextResponse.json({
      cdragon: {
        totalChampions: cdragonChampions.size,
        totalSkins: cdragonSkins.filter((s) => !s.isBase).length,
      },
      db: {
        totalChampions: dbChampions.length,
        totalSkins: dbSkins.length,
        totalWithFiles: skinsWithFiles.length,
      },
      diff: {
        newChampions,
        newSkins: newSkins.map((s) => ({
          ...s,
          championName: cdragonChampions.get(s.championId) || `Champion ${s.championId}`,
        })),
        newSkinsByChampion: Array.from(newSkinsByChampion.entries()).map(
          ([champId, skins]) => ({
            championId: champId,
            championName: cdragonChampions.get(champId) || `Champion ${champId}`,
            skins,
          })
        ),
        skinsWithoutFiles: skinsWithoutFiles.map((s) => ({
          ...s,
          championName: cdragonChampions.get(s.championId) || `Champion ${s.championId}`,
        })),
        totalNew: newSkins.length,
        totalMissingFiles: skinsWithoutFiles.length,
      },
    })
  } catch (error) {
    console.error('Error syncing with CommunityDragon:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Import new skins from CommunityDragon into DB
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { skinIds, importAll } = body as { skinIds?: number[]; importAll?: boolean }

    // Fetch from CommunityDragon
    const [skinsRes, championsRes] = await Promise.all([
      fetch(CDRAGON_SKINS_URL, { next: { revalidate: 0 } }),
      fetch(CDRAGON_CHAMPIONS_URL, { next: { revalidate: 0 } }),
    ])

    if (!skinsRes.ok || !championsRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch from CommunityDragon' },
        { status: 502 }
      )
    }

    const [cdragonSkinsRaw, cdragonChampionsRaw] = await Promise.all([
      skinsRes.json() as Promise<Record<string, CDragonSkin>>,
      championsRes.json() as Promise<CDragonChampion[]>,
    ])

    // Build champion map
    const champMap = new Map<number, string>()
    for (const c of cdragonChampionsRaw) {
      if (c.id > 0) champMap.set(c.id, c.name)
    }

    // Build full skin list including chromas with parent tracking
    const allCdragonSkins = new Map<number, {
      name: string; championId: number; isBase: boolean
      isChroma: boolean; parentSkinId: number | null
    }>()
    for (const [skinIdStr, skin] of Object.entries(cdragonSkinsRaw)) {
      const skinId = parseInt(skinIdStr)
      if (isNaN(skinId)) continue
      const championId = Math.floor(skinId / 1000)
      allCdragonSkins.set(skinId, {
        name: skin.name,
        championId,
        isBase: skin.isBase || skinId % 1000 === 0,
        isChroma: false,
        parentSkinId: null,
      })
      if (skin.chromas) {
        for (const chroma of skin.chromas) {
          allCdragonSkins.set(chroma.id, {
            name: chroma.name,
            championId,
            isBase: false,
            isChroma: true,
            parentSkinId: skinId,
          })
        }
      }
    }

    // Get existing DB skins
    const dbSkins = await prisma.leagueSkin.findMany({ select: { skinId: true } })
    const dbSkinSet = new Set(dbSkins.map((s) => s.skinId))

    // Determine which skins to import
    let toImport: {
      skinId: number; name: string; championId: number
      isChroma: boolean; parentSkinId: number | null
    }[] = []

    if (importAll) {
      for (const [skinId, data] of allCdragonSkins) {
        if (!dbSkinSet.has(skinId) && !data.isBase) {
          toImport.push({
            skinId, name: data.name, championId: data.championId,
            isChroma: data.isChroma, parentSkinId: data.parentSkinId,
          })
        }
      }
    } else if (skinIds?.length) {
      for (const skinId of skinIds) {
        const data = allCdragonSkins.get(skinId)
        if (data && !dbSkinSet.has(skinId)) {
          toImport.push({
            skinId, name: data.name, championId: data.championId,
            isChroma: data.isChroma, parentSkinId: data.parentSkinId,
          })
        }
      }
    }

    if (toImport.length === 0) {
      return NextResponse.json({ success: true, imported: 0, message: 'No new skins to import' })
    }

    // Ensure all champions exist
    const championsNeeded = new Set(toImport.map((s) => s.championId))
    for (const champId of championsNeeded) {
      const name = champMap.get(champId) || `Champion ${champId}`
      await prisma.leagueChampion.upsert({
        where: { championId: champId },
        create: { championId: champId, nameEn: name },
        update: { nameEn: name },
      })
    }

    // Import skins - main skins first, then chromas (to ensure parent exists)
    const mainSkins = toImport.filter(s => !s.isChroma)
    const chromaSkins = toImport.filter(s => s.isChroma)

    let imported = 0
    for (const skin of [...mainSkins, ...chromaSkins]) {
      await (prisma.leagueSkin as any).upsert({
        where: { skinId: skin.skinId },
        create: {
          skinId: skin.skinId,
          championId: skin.championId,
          nameEn: skin.name,
          isChroma: skin.isChroma,
          parentSkinId: skin.parentSkinId,
        },
        update: {
          nameEn: skin.name,
          isChroma: skin.isChroma,
          parentSkinId: skin.parentSkinId,
        },
      })
      imported++
    }

    return NextResponse.json({
      success: true,
      imported,
      championsCreated: championsNeeded.size,
    })
  } catch (error) {
    console.error('Error importing from CommunityDragon:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

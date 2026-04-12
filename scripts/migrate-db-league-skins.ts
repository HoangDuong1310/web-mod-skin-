/**
 * Update league_skins DB records:
 * 1. Set parentSkinId and isChroma based on CommunityDragon data
 * 2. Update fileUrl to match new R2 nested structure
 * 
 * Target R2 structure:
 *   Main skin:  league-skins/skins/{championId}/{skinId}/{skinId}.zip
 *   Chroma:     league-skins/skins/{championId}/{parentSkinId}/{chromaId}/{chromaId}.zip
 * 
 * Usage: npx tsx scripts/migrate-db-league-skins.ts [--dry-run]
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const DRY_RUN = process.argv.includes('--dry-run')

async function main() {
  console.log(`=== DB League Skins Migration ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`)

  // 1. Fetch CommunityDragon skins to get chroma parent info
  console.log('Fetching CommunityDragon skins data...')
  const res = await fetch('https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/skins.json')
  const cdragonSkins = await res.json() as Record<string, { id: number; name: string; isBase: boolean; chromas?: { id: number; name: string }[] }>

  // Build chroma → parent map
  const chromaParentMap = new Map<number, number>()
  for (const [skinIdStr, skin] of Object.entries(cdragonSkins)) {
    const skinId = parseInt(skinIdStr)
    if (skin.chromas) {
      for (const chroma of skin.chromas) {
        chromaParentMap.set(chroma.id, skinId)
      }
    }
  }
  console.log(`Found ${chromaParentMap.size} chromas in CommunityDragon\n`)

  // 2. Get all skins from DB
  const dbSkins = await prisma.leagueSkin.findMany()
  console.log(`Found ${dbSkins.length} skins in DB\n`)

  let updatedFileUrl = 0
  let updatedChroma = 0
  let errors = 0

  for (const skin of dbSkins) {
    const updates: any = {}

    // Determine if this skin is a chroma
    const parentSkinId = chromaParentMap.get(skin.skinId)
    const isChroma = !!parentSkinId

    // Set parentSkinId and isChroma if not already set
    if (isChroma && !skin.parentSkinId) {
      updates.parentSkinId = parentSkinId
      updates.isChroma = true
      updatedChroma++
      console.log(`chroma: ${skin.skinId} (${skin.nameEn}) → parent: ${parentSkinId}`)
    }

    // Calculate correct fileUrl based on new R2 structure
    if (skin.fileUrl) {
      const effectiveParent = parentSkinId || skin.parentSkinId
      let correctFileUrl: string
      if (effectiveParent) {
        correctFileUrl = `league-skins/skins/${skin.championId}/${effectiveParent}/${skin.skinId}/${skin.skinId}.zip`
      } else {
        correctFileUrl = `league-skins/skins/${skin.championId}/${skin.skinId}/${skin.skinId}.zip`
      }

      if (skin.fileUrl !== correctFileUrl) {
        updates.fileUrl = correctFileUrl
        updatedFileUrl++
        console.log(`fileUrl: ${skin.fileUrl} → ${correctFileUrl}`)
      }
    }

    if (Object.keys(updates).length > 0) {
      if (!DRY_RUN) {
        try {
          await prisma.leagueSkin.update({
            where: { skinId: skin.skinId },
            data: updates,
          })
        } catch (err) {
          console.error(`  ERROR updating ${skin.skinId}: ${err}`)
          errors++
        }
      }
    }
  }

  console.log(`\n=== Summary ===`)
  console.log(`Total skins: ${dbSkins.length}`)
  console.log(`FileUrl updated: ${updatedFileUrl}`)
  console.log(`Chromas identified: ${updatedChroma}`)
  console.log(`Errors: ${errors}`)

  if (DRY_RUN) {
    console.log(`\nThis was a DRY RUN. Run without --dry-run to actually update.`)
  }

  await prisma.$disconnect()
}

main().catch(console.error)

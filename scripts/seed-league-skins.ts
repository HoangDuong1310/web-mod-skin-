/**
 * Seed League Skins: Import champion/skin metadata from LeagueSkins data folder
 * and optionally upload .zip files to R2
 * 
 * Usage:
 *   npx tsx scripts/seed-league-skins.ts                    # Metadata only (needs data dir)
 *   npx tsx scripts/seed-league-skins.ts --upload           # Metadata + upload files to R2
 *   npx tsx scripts/seed-league-skins.ts --data-dir /path   # Custom data directory
 *   npx tsx scripts/seed-league-skins.ts --sync-r2          # Sync DB with files already on R2 (no local files needed)
 */

import { PrismaClient } from '@prisma/client'
import { readFile, readdir, stat } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { createHash } from 'crypto'

const prisma = new PrismaClient()

// Parse args
const args = process.argv.slice(2)
const shouldUpload = args.includes('--upload')
const shouldSyncR2 = args.includes('--sync-r2')
const dataDirIndex = args.indexOf('--data-dir')
const DATA_DIR = dataDirIndex !== -1 ? args[dataDirIndex + 1] : 'D:\\data\\LeagueSkins-main'

// Lazy import R2 only if uploading or syncing
async function getR2() {
  const { uploadToR2, R2_PREFIXES, listR2Objects, getBufferFromR2 } = await import('../lib/r2')
  return { uploadToR2, R2_PREFIXES, listR2Objects, getBufferFromR2 }
}

async function loadSkinNamesFromR2(r2Key: string, getBufferFromR2: (key: string) => Promise<{ buffer: Buffer }>): Promise<Record<string, string>> {
  try {
    const { buffer } = await getBufferFromR2(r2Key)
    return JSON.parse(buffer.toString('utf-8'))
  } catch {
    return {}
  }
}

async function loadSkinNames(lang: string): Promise<Record<string, string>> {
  const filePath = join(DATA_DIR, 'resources', lang, 'skin_ids.json')
  if (!existsSync(filePath)) return {}
  const content = await readFile(filePath, 'utf-8')
  return JSON.parse(content)
}

function getChampionIdFromSkinId(skinId: number): number {
  // Champion ID = skinId / 1000 (integer division)
  return Math.floor(skinId / 1000)
}

function getChampionName(skinNames: Record<string, string>, championId: number): string {
  // The base skin (championId * 1000) has the champion name
  const baseSkinId = championId * 1000
  return skinNames[baseSkinId.toString()] || `Champion ${championId}`
}

async function syncFromR2() {
  const { listR2Objects, R2_PREFIXES, uploadToR2, getBufferFromR2 } = await getR2()
  const prefix = R2_PREFIXES.LEAGUE_SKINS + '/skins/'

  // --- Load skin names from R2 resource files ---
  console.log('📖 Loading skin names from R2 resources...')
  const resourcePrefix = `${R2_PREFIXES.LEAGUE_SKINS}/resources/`
  const resourceObjects = await listR2Objects(resourcePrefix)
  const resourceFiles = resourceObjects.filter(o => o.key.endsWith('/skin_ids.json'))
  const resourceLanguages: string[] = []
  for (const obj of resourceFiles) {
    const match = obj.key.match(/resources\/([^/]+)\/skin_ids\.json$/)
    if (match) resourceLanguages.push(match[1])
  }
  console.log(`   Found ${resourceLanguages.length} language resource files: ${resourceLanguages.join(', ')}`)

  // Load EN skin names (try 'en' first, then 'default')
  let skinNamesEn: Record<string, string> = {}
  if (resourceLanguages.includes('default')) {
    const defaultNames = await loadSkinNamesFromR2(`${resourcePrefix}default/skin_ids.json`, getBufferFromR2)
    skinNamesEn = { ...defaultNames }
    console.log(`   Loaded ${Object.keys(defaultNames).length} default skin names`)
  }
  if (resourceLanguages.includes('en')) {
    const enNames = await loadSkinNamesFromR2(`${resourcePrefix}en/skin_ids.json`, getBufferFromR2)
    skinNamesEn = { ...skinNamesEn, ...enNames }
    console.log(`   Loaded ${Object.keys(enNames).length} EN skin names`)
  }

  // Load VI skin names
  let skinNamesVi: Record<string, string> = {}
  if (resourceLanguages.includes('vi')) {
    skinNamesVi = await loadSkinNamesFromR2(`${resourcePrefix}vi/skin_ids.json`, getBufferFromR2)
    console.log(`   Loaded ${Object.keys(skinNamesVi).length} VI skin names`)
  }

  console.log(`   Total EN names: ${Object.keys(skinNamesEn).length}`)

  // Helper to get champion name from skin names
  function getChampNameFromSkinNames(championId: number): string {
    const baseSkinId = championId * 1000
    return skinNamesEn[baseSkinId.toString()] || `Champion ${championId}`
  }

  console.log(`\n🔍 Scanning R2 prefix: ${prefix}`)
  const objects = await listR2Objects(prefix)

  // Filter only .zip files (skip manifest.json etc.)
  const zipFiles = objects.filter(o => o.key.endsWith('.zip'))
  console.log(`   Found ${zipFiles.length} zip files on R2`)

  if (zipFiles.length === 0) {
    console.log('   No zip files found. Nothing to sync.')
    return
  }

  // Parse championId and skinId from R2 keys: league-skins/{championId}/{skinId}.zip
  const championsSet = new Map<number, { nameEn: string; nameVi: string | null }>()
  const skinsFromR2: { skinId: number; championId: number; nameEn: string; nameVi: string | null; fileUrl: string; fileSize: number }[] = []

  for (const obj of zipFiles) {
    // key format: league-skins/{championId}/{skinId}.zip
    const match = obj.key.match(/league-skins\/skins\/(\d+)\/(\d+)\.zip$/)
    if (!match) continue

    const championId = parseInt(match[1])
    const skinId = parseInt(match[2])

    if (!championsSet.has(championId)) {
      const champNameEn = getChampNameFromSkinNames(championId)
      const champNameVi = skinNamesVi[(championId * 1000).toString()] || null
      championsSet.set(championId, { nameEn: champNameEn, nameVi: champNameVi })
    }

    const skinNameEn = skinNamesEn[skinId.toString()] || `Skin ${skinId}`
    const skinNameVi = skinNamesVi[skinId.toString()] || null

    skinsFromR2.push({
      skinId,
      championId,
      nameEn: skinNameEn,
      nameVi: skinNameVi,
      fileUrl: obj.key,
      fileSize: obj.size,
    })
  }

  console.log(`   Parsed: ${championsSet.size} champions, ${skinsFromR2.length} skins`)

  // Upsert champions
  console.log('\n🏗️  Upserting champions...')
  let champCount = 0
  for (const [championId, data] of championsSet) {
    await prisma.leagueChampion.upsert({
      where: { championId },
      create: { championId, nameEn: data.nameEn, nameVi: data.nameVi },
      update: { nameEn: data.nameEn, nameVi: data.nameVi },
    })
    champCount++
  }
  console.log(`   ✅ ${champCount} champions upserted`)

  // Upsert skins with file info
  console.log('\n🎨 Upserting skins with R2 file info...')
  let skinCount = 0
  for (const skin of skinsFromR2) {
    await prisma.leagueSkin.upsert({
      where: { skinId: skin.skinId },
      create: {
        skinId: skin.skinId,
        championId: skin.championId,
        nameEn: skin.nameEn,
        nameVi: skin.nameVi,
        fileUrl: skin.fileUrl,
        fileSize: skin.fileSize,
      },
      update: {
        nameEn: skin.nameEn,
        nameVi: skin.nameVi,
        fileUrl: skin.fileUrl,
        fileSize: skin.fileSize,
      },
    })
    skinCount++
    if (skinCount % 100 === 0) {
      process.stdout.write(`   ${skinCount}/${skinsFromR2.length}\r`)
    }
  }
  console.log(`   ✅ ${skinCount} skins synced from R2`)

  // Generate manifest
  console.log('\n📋 Generating manifest...')
  const skins = await prisma.leagueSkin.findMany({
    where: { isActive: true, fileUrl: { not: null } },
    select: { skinId: true, fileHash: true, fileSize: true },
    orderBy: [{ championId: 'asc' }, { skinId: 'asc' }],
  })

  const skinsMap: Record<string, { hash: string | null; size: number | null }> = {}
  for (const s of skins) {
    skinsMap[s.skinId.toString()] = {
      hash: s.fileHash ? s.fileHash.substring(0, 8) : null,
      size: s.fileSize,
    }
  }

  const manifest = {
    version: Date.now(),
    resources: resourceLanguages,
    skins: skinsMap,
  }

  const manifestBuffer = Buffer.from(JSON.stringify(manifest), 'utf-8')
  await uploadToR2(`${R2_PREFIXES.LEAGUE_SKINS}/manifest.json`, manifestBuffer, 'application/json')
  console.log(`   ✅ Manifest uploaded (${Object.keys(manifest.skins).length} skins, ${manifest.resources.length} languages)`)
  console.log('\n✅ Sync from R2 done!')
}

async function main() {
  console.log('🎮 League Skins Seeder')

  // --sync-r2 mode: scan R2 for existing files and update DB (no local files needed)
  if (shouldSyncR2) {
    console.log('   Mode: Sync DB with R2 files')
    console.log('')
    await syncFromR2()
    return
  }

  console.log(`   Data dir: ${DATA_DIR}`)
  console.log(`   Upload to R2: ${shouldUpload ? 'YES' : 'NO (metadata only)'}`)
  console.log('')

  if (!existsSync(DATA_DIR)) {
    console.error(`❌ Data directory not found: ${DATA_DIR}`)
    process.exit(1)
  }

  // Load skin names
  console.log('📖 Loading skin names...')
  const namesEn = await loadSkinNames('en')
  const namesVi = await loadSkinNames('vi')
  const namesDefault = await loadSkinNames('default')

  // Merge: prefer en, fallback to default
  const skinNamesEn: Record<string, string> = { ...namesDefault, ...namesEn }
  const skinNamesVi: Record<string, string> = namesVi

  console.log(`   Found ${Object.keys(skinNamesEn).length} skin names (EN)`)
  console.log(`   Found ${Object.keys(skinNamesVi).length} skin names (VI)`)

  // Scan skins directory
  const skinsDir = join(DATA_DIR, 'skins')
  if (!existsSync(skinsDir)) {
    console.error(`❌ Skins directory not found: ${skinsDir}`)
    process.exit(1)
  }

  const championDirs = await readdir(skinsDir)
  console.log(`\n📁 Found ${championDirs.length} champion directories`)

  // Collect all skin data
  const championsMap = new Map<number, { nameEn: string; nameVi: string | null }>()
  const skinsData: {
    skinId: number
    championId: number
    nameEn: string
    nameVi: string | null
    zipPath: string | null
  }[] = []

  let totalZips = 0

  for (const champDirName of championDirs) {
    const championId = parseInt(champDirName)
    if (isNaN(championId)) continue

    const champPath = join(skinsDir, champDirName)
    const champStat = await stat(champPath)
    if (!champStat.isDirectory()) continue

    // Get champion name from base skin
    const champNameEn = getChampionName(skinNamesEn, championId)
    const champNameVi = skinNamesVi[(championId * 1000).toString()] || null

    championsMap.set(championId, { nameEn: champNameEn, nameVi: champNameVi })

    // Scan skin subdirectories
    const skinDirs = await readdir(champPath)

    for (const skinDirName of skinDirs) {
      const skinId = parseInt(skinDirName)
      if (isNaN(skinId)) continue

      const skinPath = join(champPath, skinDirName)
      const skinStat = await stat(skinPath)
      if (!skinStat.isDirectory()) continue

      const zipFile = join(skinPath, `${skinId}.zip`)
      const hasZip = existsSync(zipFile)
      if (hasZip) totalZips++

      skinsData.push({
        skinId,
        championId,
        nameEn: skinNamesEn[skinId.toString()] || `Skin ${skinId}`,
        nameVi: skinNamesVi[skinId.toString()] || null,
        zipPath: hasZip ? zipFile : null,
      })

      // Scan chroma subdirectories (e.g. skins/1/1013/1014/1014.zip)
      const chromaDirs = await readdir(skinPath)
      for (const chromaDirName of chromaDirs) {
        const chromaId = parseInt(chromaDirName)
        if (isNaN(chromaId)) continue

        const chromaPath = join(skinPath, chromaDirName)
        const chromaStat = await stat(chromaPath)
        if (!chromaStat.isDirectory()) continue

        const chromaZip = join(chromaPath, `${chromaId}.zip`)
        const hasChromaZip = existsSync(chromaZip)
        if (hasChromaZip) totalZips++

        skinsData.push({
          skinId: chromaId,
          championId,
          nameEn: skinNamesEn[chromaId.toString()] || `Skin ${chromaId}`,
          nameVi: skinNamesVi[chromaId.toString()] || null,
          zipPath: hasChromaZip ? chromaZip : null,
        })
      }
    }
  }

  console.log(`   Champions: ${championsMap.size}`)
  console.log(`   Skins: ${skinsData.length}`)
  console.log(`   Zip files: ${totalZips}`)

  // Also add skins from skin_ids.json that don't have directories (metadata only)
  for (const [skinIdStr, nameEn] of Object.entries(skinNamesEn)) {
    const skinId = parseInt(skinIdStr)
    if (skinsData.some(s => s.skinId === skinId)) continue

    const championId = getChampionIdFromSkinId(skinId)
    if (!championsMap.has(championId)) {
      championsMap.set(championId, {
        nameEn: getChampionName(skinNamesEn, championId),
        nameVi: skinNamesVi[(championId * 1000).toString()] || null,
      })
    }

    skinsData.push({
      skinId,
      championId,
      nameEn,
      nameVi: skinNamesVi[skinIdStr] || null,
      zipPath: null,
    })
  }

  console.log(`   Total skins (with metadata-only): ${skinsData.length}`)

  // Upsert champions
  console.log('\n🏗️  Upserting champions...')
  let champCount = 0
  for (const [championId, data] of championsMap) {
    await prisma.leagueChampion.upsert({
      where: { championId },
      create: { championId, nameEn: data.nameEn, nameVi: data.nameVi },
      update: { nameEn: data.nameEn, nameVi: data.nameVi },
    })
    champCount++
    if (champCount % 50 === 0) {
      process.stdout.write(`   ${champCount}/${championsMap.size}\r`)
    }
  }
  console.log(`   ✅ ${champCount} champions upserted`)

  // Upsert skins
  console.log('\n🎨 Upserting skins...')
  let skinCount = 0
  let uploadCount = 0
  let skipCount = 0

  const r2 = shouldUpload ? await getR2() : null

  for (const skin of skinsData) {
    const existing = await prisma.leagueSkin.findUnique({
      where: { skinId: skin.skinId },
      select: { fileHash: true, fileUrl: true },
    })

    const createData: any = {
      skinId: skin.skinId,
      championId: skin.championId,
      nameEn: skin.nameEn,
      nameVi: skin.nameVi,
    }

    // Upload file if requested and available
    if (shouldUpload && r2 && skin.zipPath) {
      const buffer = await readFile(skin.zipPath)
      const hash = createHash('md5').update(buffer).digest('hex')
      const r2Key = `${r2.R2_PREFIXES.LEAGUE_SKINS}/skins/${skin.championId}/${skin.skinId}.zip`

      // Skip if same hash and correct path already uploaded
      if (existing?.fileHash === hash && existing.fileUrl === r2Key) {
        skipCount++
      } else {
        await r2.uploadToR2(r2Key, buffer, 'application/zip')

        createData.fileUrl = r2Key
        createData.fileSize = buffer.length
        createData.fileHash = hash
        uploadCount++
      }
    }

    await prisma.leagueSkin.upsert({
      where: { skinId: skin.skinId },
      create: createData,
      update: {
        nameEn: skin.nameEn,
        nameVi: skin.nameVi,
        ...(createData.fileUrl ? {
          fileUrl: createData.fileUrl,
          fileSize: createData.fileSize,
          fileHash: createData.fileHash,
          version: { increment: 1 },
        } : {}),
      },
    })

    skinCount++
    if (skinCount % 100 === 0) {
      process.stdout.write(`   ${skinCount}/${skinsData.length} (uploaded: ${uploadCount}, skipped: ${skipCount})\r`)
    }
  }

  console.log(`\n   ✅ ${skinCount} skins upserted`)
  if (shouldUpload) {
    console.log(`   📤 Uploaded: ${uploadCount}, Skipped: ${skipCount}`)
  }

  // Upload resources (skin_ids.json per language) if --upload
  if (shouldUpload && r2) {
    console.log('\n📦 Uploading resources...')
    const resourcesDir = join(DATA_DIR, 'resources')
    if (existsSync(resourcesDir)) {
      const langDirs = await readdir(resourcesDir)
      let resCount = 0
      for (const lang of langDirs) {
        const langPath = join(resourcesDir, lang)
        const langStat = await stat(langPath)
        if (!langStat.isDirectory()) continue

        const skinIdsFile = join(langPath, 'skin_ids.json')
        if (!existsSync(skinIdsFile)) continue

        const buffer = await readFile(skinIdsFile)
        const r2Key = `${r2.R2_PREFIXES.LEAGUE_SKINS}/resources/${lang}/skin_ids.json`
        await r2.uploadToR2(r2Key, buffer, 'application/json')
        resCount++
      }
      console.log(`   ✅ Uploaded ${resCount} language resource files`)
    } else {
      console.log('   ⚠️ No resources directory found, skipping')
    }
  }

  // Generate manifest if files were uploaded
  if (shouldUpload && r2) {
    console.log('\n📋 Generating manifest...')
    const skins = await prisma.leagueSkin.findMany({
      where: { isActive: true, fileUrl: { not: null } },
      select: { skinId: true, fileHash: true, fileSize: true },
      orderBy: [{ championId: 'asc' }, { skinId: 'asc' }],
    })

    // Detect available resource languages
    const resourceLanguages: string[] = []
    const resourcesDir = join(DATA_DIR, 'resources')
    if (existsSync(resourcesDir)) {
      const langDirs = await readdir(resourcesDir)
      for (const lang of langDirs) {
        const skinIdsFile = join(resourcesDir, lang, 'skin_ids.json')
        if (existsSync(skinIdsFile)) resourceLanguages.push(lang)
      }
    }

    const skinsMap: Record<string, { hash: string | null; size: number | null }> = {}
    for (const s of skins) {
      skinsMap[s.skinId.toString()] = {
        hash: s.fileHash ? s.fileHash.substring(0, 8) : null,
        size: s.fileSize,
      }
    }

    const manifest = {
      version: Date.now(),
      resources: resourceLanguages,
      skins: skinsMap,
    }

    const manifestBuffer = Buffer.from(JSON.stringify(manifest), 'utf-8')
    await r2.uploadToR2(`${r2.R2_PREFIXES.LEAGUE_SKINS}/manifest.json`, manifestBuffer, 'application/json')
    console.log(`   ✅ Manifest uploaded (${Object.keys(manifest.skins).length} skins, ${manifest.resources.length} languages)`)
  }

  console.log('\n✅ Done!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

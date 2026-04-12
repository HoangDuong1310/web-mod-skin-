/**
 * Migrate R2 league skin files to proper nested structure
 * 
 * This script does THREE things:
 * 1. Fix "leaked" files: league-skins/{champId}/{skinId}/{skinId}.zip → league-skins/skins/{champId}/{skinId}/{skinId}.zip
 * 2. Nest chromas under parent skins: league-skins/skins/{champId}/{chromaId}/{chromaId}.zip → league-skins/skins/{champId}/{parentSkinId}/{chromaId}/{chromaId}.zip
 * 3. Already-correct files are skipped
 * 
 * Target structure (matching D:\data\RoseSkins\skins\{champId}):
 *   Main skin:  league-skins/skins/{champId}/{skinId}/{skinId}.zip
 *   Chroma:     league-skins/skins/{champId}/{parentSkinId}/{chromaId}/{chromaId}.zip
 * 
 * Usage: npx tsx scripts/migrate-r2-league-skins.ts [--dry-run]
 */
import 'dotenv/config'
import { S3Client, ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const BUCKET = process.env.R2_BUCKET_NAME || 'modskinslol'
const DRY_RUN = process.argv.includes('--dry-run')

const c = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

async function listAll(prefix: string) {
  const objects: { key: string; size: number }[] = []
  let ct: string | undefined
  do {
    const r = await c.send(new ListObjectsV2Command({
      Bucket: BUCKET, Prefix: prefix, MaxKeys: 1000, ContinuationToken: ct,
    }))
    for (const o of r.Contents || []) {
      if (o.Key) objects.push({ key: o.Key, size: o.Size || 0 })
    }
    ct = r.NextContinuationToken
  } while (ct)
  return objects
}

async function copyAndDelete(oldKey: string, newKey: string) {
  await c.send(new CopyObjectCommand({
    Bucket: BUCKET,
    CopySource: `${BUCKET}/${oldKey}`,
    Key: newKey,
  }))
  await c.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: oldKey,
  }))
}

async function main() {
  console.log(`=== R2 League Skins Full Migration ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`)

  // Step 0: Fetch CommunityDragon data to identify chromas
  console.log('Fetching CommunityDragon skins data...')
  const res = await fetch('https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/skins.json')
  const cdragonSkins = await res.json() as Record<string, { id: number; name: string; isBase: boolean; chromas?: { id: number; name: string }[] }>

  // Build chromaId → parentSkinId map
  const chromaParentMap = new Map<number, number>()
  for (const [skinIdStr, skin] of Object.entries(cdragonSkins)) {
    if (skin.chromas) {
      for (const chroma of skin.chromas) {
        chromaParentMap.set(chroma.id, parseInt(skinIdStr))
      }
    }
  }
  console.log(`Found ${chromaParentMap.size} chromas in CommunityDragon data\n`)

  // Step 1: Fix leaked files (league-skins/{champId}/...)
  console.log('--- Step 1: Fixing leaked files (missing skins/ folder) ---')
  const allFiles = await listAll('league-skins/')
  
  const leakedFiles = allFiles.filter(f => f.key.match(/^league-skins\/\d+\//))
  console.log(`Found ${leakedFiles.length} leaked files\n`)

  let fixedLeaked = 0
  let leakedErrors = 0

  for (const file of leakedFiles) {
    // league-skins/{champId}/{skinId}/{skinId}.zip → league-skins/skins/{champId}/{skinId}/{skinId}.zip
    const newKey = file.key.replace(/^league-skins\/(\d+)\//, 'league-skins/skins/$1/')
    
    // But also check if this leaked file's skin is a chroma that needs further nesting
    const match = file.key.match(/^league-skins\/(\d+)\/(\d+)\/(\d+)\.zip$/)
    let finalKey = newKey
    if (match) {
      const champId = parseInt(match[1])
      const skinId = parseInt(match[2])
      const parentSkinId = chromaParentMap.get(skinId)
      if (parentSkinId) {
        // This is a chroma - nest under parent
        finalKey = `league-skins/skins/${champId}/${parentSkinId}/${skinId}/${skinId}.zip`
      }
    }

    console.log(`  ${file.key} → ${finalKey}`)
    if (!DRY_RUN) {
      try {
        await copyAndDelete(file.key, finalKey)
        fixedLeaked++
      } catch (err) {
        console.error(`    ERROR: ${err}`)
        leakedErrors++
      }
    } else {
      fixedLeaked++
    }
  }
  console.log(`Fixed leaked: ${fixedLeaked}, Errors: ${leakedErrors}\n`)

  // Step 2: Nest chromas that are currently in skins/ but not under parent
  console.log('--- Step 2: Nesting chromas under parent skins ---')
  
  // Re-list after step 1 to get updated file list
  const skinFiles = DRY_RUN 
    ? allFiles.filter(f => f.key.match(/^league-skins\/skins\/\d+\/\d+\/\d+\.zip$/))
    : (await listAll('league-skins/skins/')).filter(f => f.key.match(/^league-skins\/skins\/\d+\/\d+\/\d+\.zip$/))
  
  console.log(`Found ${skinFiles.length} files in skins/ with nested format\n`)

  let nestedChromas = 0
  let skippedNonChroma = 0
  let alreadyNested = 0
  let chromaErrors = 0

  for (const file of skinFiles) {
    // Parse: league-skins/skins/{champId}/{skinId}/{skinId}.zip
    const match = file.key.match(/^league-skins\/skins\/(\d+)\/(\d+)\/(\d+)\.zip$/)
    if (!match) continue

    const champId = parseInt(match[1])
    const folderId = parseInt(match[2])
    const fileId = parseInt(match[3])

    // Only process if the file's skinId is a known chroma
    const parentSkinId = chromaParentMap.get(fileId)
    if (!parentSkinId) {
      skippedNonChroma++
      continue // Not a chroma, already correct
    }

    // If already nested under parent (folderId === parentSkinId), skip
    if (folderId === parentSkinId) {
      alreadyNested++
      continue
    }

    // This chroma is currently at league-skins/skins/{champId}/{chromaId}/{chromaId}.zip
    // Move to league-skins/skins/{champId}/{parentSkinId}/{chromaId}/{chromaId}.zip
    const newKey = `league-skins/skins/${champId}/${parentSkinId}/${fileId}/${fileId}.zip`

    console.log(`  ${file.key} → ${newKey}`)
    if (!DRY_RUN) {
      try {
        await copyAndDelete(file.key, newKey)
        nestedChromas++
      } catch (err) {
        console.error(`    ERROR: ${err}`)
        chromaErrors++
      }
    } else {
      nestedChromas++
    }
  }

  console.log(`\nChromas nested: ${nestedChromas}`)
  console.log(`Already nested: ${alreadyNested}`)
  console.log(`Non-chroma (skipped): ${skippedNonChroma}`)
  console.log(`Errors: ${chromaErrors}`)

  // Summary
  console.log(`\n=== TOTAL SUMMARY ===`)
  console.log(`Leaked files fixed: ${fixedLeaked}`)
  console.log(`Chromas nested: ${nestedChromas}`)
  console.log(`Total errors: ${leakedErrors + chromaErrors}`)

  if (DRY_RUN) {
    console.log(`\nThis was a DRY RUN. Run without --dry-run to actually migrate.`)
  }
}

main().catch(console.error)

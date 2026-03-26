/**
 * Cleanup old R2 objects at wrong paths
 * Deletes league-skins/{championId}/{skinId}.zip (old path)
 * Keeps league-skins/skins/... and league-skins/resources/... and league-skins/manifest.json
 * 
 * Usage:
 *   npx tsx scripts/cleanup-old-r2-skins.ts          # Dry run (list only)
 *   npx tsx scripts/cleanup-old-r2-skins.ts --delete  # Actually delete
 */

import { listR2Objects, deleteFromR2, R2_PREFIXES } from '../lib/r2'

const shouldDelete = process.argv.includes('--delete')

async function main() {
  console.log(`🧹 Cleanup old R2 skin paths`)
  console.log(`   Mode: ${shouldDelete ? '🔴 DELETE' : '🟡 DRY RUN (use --delete to actually delete)'}`)
  console.log('')

  const prefix = R2_PREFIXES.LEAGUE_SKINS + '/'
  console.log(`🔍 Scanning R2 prefix: ${prefix}`)
  const objects = await listR2Objects(prefix)
  console.log(`   Found ${objects.length} total objects`)

  // Find objects that are NOT in skins/, resources/, or manifest.json
  const oldObjects = objects.filter(o => {
    const relativePath = o.key.substring(prefix.length) // e.g. "1/1000.zip" or "skins/1/1000.zip"
    // Keep: skins/..., resources/..., manifest.json
    if (relativePath.startsWith('skins/')) return false
    if (relativePath.startsWith('resources/')) return false
    if (relativePath === 'manifest.json') return false
    return true
  })

  console.log(`   Old objects to delete: ${oldObjects.length}`)

  if (oldObjects.length === 0) {
    console.log('\n✅ No old objects found. Nothing to clean up!')
    return
  }

  // Show some examples
  console.log('\n📋 Examples:')
  oldObjects.slice(0, 10).forEach(o => console.log(`   ${o.key} (${o.size} bytes)`))
  if (oldObjects.length > 10) {
    console.log(`   ... and ${oldObjects.length - 10} more`)
  }

  if (!shouldDelete) {
    console.log('\n⚠️  Dry run complete. Use --delete to actually delete these objects.')
    return
  }

  // Delete old objects
  console.log('\n🗑️  Deleting old objects...')
  let deleted = 0
  let errors = 0

  for (const obj of oldObjects) {
    try {
      await deleteFromR2(obj.key)
      deleted++
      if (deleted % 100 === 0) {
        process.stdout.write(`   Deleted ${deleted}/${oldObjects.length}\r`)
      }
    } catch (err) {
      errors++
      console.error(`   ❌ Failed to delete: ${obj.key}`)
    }
  }

  console.log(`\n   ✅ Deleted: ${deleted}`)
  if (errors > 0) console.log(`   ❌ Errors: ${errors}`)
  console.log('\n✅ Cleanup done!')
}

main().catch(console.error)

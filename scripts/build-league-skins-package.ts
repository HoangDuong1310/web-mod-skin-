/**
 * Build full league-skins package zip (streaming R2 → Zip → R2)
 *
 * Usage: npx tsx scripts/build-league-skins-package.ts
 *
 * This streams files from R2, pipes through archiver (STORE mode),
 * and uploads the resulting zip back to R2 via multipart upload.
 * Memory usage: ~50-100MB. Disk usage: 0.
 *
 * Writes progress to DB every 50 files so dashboard can show realtime progress.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { buildFullPackage, type BuildProgress } from '../lib/league-skins-package'

const prisma = new PrismaClient()
const CATEGORY = 'league-skins'

async function upsertSetting(key: string, value: string) {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value, category: CATEGORY },
  })
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`
  if (m > 0) return `${m}m ${s % 60}s`
  return `${s}s`
}

async function main() {
  console.log('🏗️  Building full league-skins package...\n')
  const startTime = Date.now()

  let lastPhase = ''
  let lastDbWrite = 0

  const result = await buildFullPackage(async (progress: BuildProgress) => {
    if (progress.phase !== lastPhase) {
      lastPhase = progress.phase
      switch (progress.phase) {
        case 'listing':
          process.stdout.write('📋 Listing R2 files...')
          break
        case 'downloading':
          console.log(` found ${progress.total} files`)
          console.log('📥 Syncing files (cached files will be skipped)...')
          break
        case 'zipping':
          console.log(`\n📦 Building zip from cache...`)
          break
        case 'uploading':
          console.log('\n☁️  Uploading zip to R2...')
          break
        case 'done':
          console.log('')
          break
        case 'error':
          console.error(`\n❌ Error: ${progress.error}`)
          break
      }
    }

    if (progress.phase === 'downloading' || progress.phase === 'zipping' || progress.phase === 'uploading') {
      const pct = progress.total > 0
        ? ((progress.current / progress.total) * 100).toFixed(1)
        : '0'
      const elapsed = formatDuration(Date.now() - startTime)
      const labels: Record<string, string> = {
        downloading: `📥 Sync (${progress.cached} cached, ${progress.downloaded} new)`,
        zipping: '📦 Zipping',
        uploading: '☁️  Uploading',
      }
      const label = labels[progress.phase] || progress.phase
      process.stdout.write(
        `\r${label}: ${progress.current}/${progress.total} (${pct}%) | ${formatBytes(progress.bytesProcessed)} | ${elapsed}`
          .padEnd(120)
      )

      // Write progress to DB every 50 files or every 3 seconds
      const now = Date.now()
      if (progress.current % 50 === 0 || now - lastDbWrite > 3000) {
        lastDbWrite = now
        const progressJson = JSON.stringify({
          current: progress.current,
          total: progress.total,
          percent: parseFloat(pct),
          bytes: progress.bytesProcessed,
          elapsed: formatDuration(now - startTime),
        })
        upsertSetting('league_skins_package_progress', progressJson).catch(() => {})
      }
    }
  })

  const elapsed = formatDuration(Date.now() - startTime)

  // Clear progress, set final status
  await upsertSetting('league_skins_package_progress', '')
  await upsertSetting('league_skins_package_status', 'ready')
  await upsertSetting('league_skins_package_built_at', new Date().toISOString())
  await upsertSetting('league_skins_package_hash', result.hash.substring(0, 8))
  await upsertSetting('league_skins_package_size', formatBytes(result.size))
  await upsertSetting('league_skins_package_files', result.fileCount.toString())

  console.log('\n✅ Package built successfully!')
  console.log(`   📦 Key: ${result.key}`)
  console.log(`   📊 Size: ${formatBytes(result.size)}`)
  console.log(`   🔑 Hash: ${result.hash.substring(0, 8)}`)
  console.log(`   📁 Files: ${result.fileCount}`)
  console.log(`   ⏱️  Time: ${elapsed}`)

  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error('\n❌ Build failed:', err)
  await upsertSetting('league_skins_package_status', 'error')
  await upsertSetting('league_skins_package_error', err.message || String(err))
  await upsertSetting('league_skins_package_progress', '')
  await prisma.$disconnect()
  process.exit(1)
})

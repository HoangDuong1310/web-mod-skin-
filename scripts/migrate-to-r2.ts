/**
 * Migration script: Upload existing local files to Cloudflare R2
 * 
 * Usage: npx tsx scripts/migrate-to-r2.ts [--dry-run]
 * 
 * This script:
 * 1. Scans local uploads directories for existing files
 * 2. Uploads each file to R2 with the correct prefix
 * 3. Updates database records with new R2 keys/URLs
 * 
 * Use --dry-run to preview changes without uploading
 */

import { PrismaClient } from '@prisma/client'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { readFile, readdir, stat } from 'fs/promises'
import { join, extname } from 'path'
import { existsSync } from 'fs'

const prisma = new PrismaClient()
const isDryRun = process.argv.includes('--dry-run')

// R2 config from env
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'modskinslol'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://cdn.modskinslol.com'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

interface MigrationResult {
  total: number
  uploaded: number
  skipped: number
  failed: number
  errors: string[]
}

async function fileExistsInR2(key: string): Promise<boolean> {
  try {
    await r2Client.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }))
    return true
  } catch {
    return false
  }
}

async function uploadFileToR2(key: string, buffer: Buffer, contentType: string): Promise<void> {
  await r2Client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }))
}

function getContentType(filename: string): string {
  const ext = extname(filename).toLowerCase()
  const types: Record<string, string> = {
    '.exe': 'application/x-msdownload',
    '.msi': 'application/x-msi',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
    '.fantome': 'application/octet-stream',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  }
  return types[ext] || 'application/octet-stream'
}

async function migrateDirectory(
  localDir: string,
  r2Prefix: string,
  label: string
): Promise<MigrationResult> {
  const result: MigrationResult = { total: 0, uploaded: 0, skipped: 0, failed: 0, errors: [] }

  if (!existsSync(localDir)) {
    console.log(`  ⚪ Directory not found: ${localDir} - skipping`)
    return result
  }

  const files = await readdir(localDir)
  result.total = files.length
  console.log(`  📁 Found ${files.length} files in ${localDir}`)

  for (const file of files) {
    const filePath = join(localDir, file)
    const fileStat = await stat(filePath)
    
    if (!fileStat.isFile()) continue

    const r2Key = `${r2Prefix}/${file}`
    const sizeMB = (fileStat.size / 1024 / 1024).toFixed(2)

    try {
      // Check if already uploaded
      const exists = await fileExistsInR2(r2Key)
      if (exists) {
        console.log(`  ⏭️  Skip (already exists): ${r2Key}`)
        result.skipped++
        continue
      }

      if (isDryRun) {
        console.log(`  🔍 [DRY RUN] Would upload: ${file} → ${r2Key} (${sizeMB} MB)`)
        result.uploaded++
        continue
      }

      const buffer = await readFile(filePath)
      const contentType = getContentType(file)
      await uploadFileToR2(r2Key, buffer, contentType)
      
      console.log(`  ✅ Uploaded: ${file} → ${r2Key} (${sizeMB} MB)`)
      result.uploaded++
    } catch (error) {
      const msg = `Failed to upload ${file}: ${error instanceof Error ? error.message : error}`
      console.error(`  ❌ ${msg}`)
      result.errors.push(msg)
      result.failed++
    }
  }

  return result
}

async function updateProductRecords(): Promise<void> {
  console.log('\n📝 Updating product database records...')
  
  const products = await prisma.product.findMany({
    where: {
      filename: { not: null },
    }
  })

  let updated = 0
  for (const product of products) {
    const filename = (product as any).filename as string
    if (!filename || filename.startsWith('software/')) continue // Already migrated

    const r2Key = `software/${filename}`
    const downloadUrl = `/api/download/software/${encodeURIComponent(filename)}`

    if (isDryRun) {
      console.log(`  🔍 [DRY RUN] Would update product ${product.id}: filename → ${r2Key}`)
      updated++
      continue
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        filename: r2Key,
        downloadUrl: downloadUrl,
      }
    })
    console.log(`  ✅ Updated product ${product.id}: ${product.title}`)
    updated++
  }

  console.log(`  📊 Updated ${updated} products`)
}

async function updateProductImageRecords(): Promise<void> {
  console.log('\n📝 Updating product image URLs...')
  
  const products = await prisma.product.findMany({
    where: {
      images: { not: null },
    }
  })

  let updated = 0
  for (const product of products) {
    const images = product.images as string | null
    if (!images) continue

    try {
      const parsed = JSON.parse(images) as string[]
      let changed = false
      const updatedImages = parsed.map((url: string) => {
        // Match old patterns: /api/uploads/images/products/filename.ext
        if (url.includes('/api/uploads/images/products/') || url.includes('/uploads/images/products/')) {
          const filename = url.split('/').pop()
          if (filename) {
            changed = true
            return `${R2_PUBLIC_URL}/images/products/${filename}`
          }
        }
        return url
      })

      if (!changed) continue

      if (isDryRun) {
        console.log(`  🔍 [DRY RUN] Would update images for product ${product.id}: ${product.title}`)
        updated++
        continue
      }

      await prisma.product.update({
        where: { id: product.id },
        data: { images: JSON.stringify(updatedImages) }
      })
      console.log(`  ✅ Updated images for product ${product.id}: ${product.title}`)
      updated++
    } catch {
      console.log(`  ⚠️  Could not parse images for product ${product.id}, skipping`)
    }
  }

  console.log(`  📊 Updated ${updated} product image records`)
}

async function updateCustomSkinRecords(): Promise<void> {
  console.log('\n📝 Updating custom skin database records...')
  
  const skins = await prisma.customSkin.findMany({
    where: { deletedAt: null }
  })

  let updated = 0
  for (const skin of skins) {
    if (!skin.filePath || !skin.filePath.includes('/uploads/')) continue // Already migrated

    // Convert local path to R2 key
    const r2Key = skin.filePath.split('/uploads/').pop() || skin.filePath
    
    // Update preview images if they are local paths
    let previewImages = skin.previewImages
    if (previewImages && typeof previewImages === 'string') {
      try {
        const paths = JSON.parse(previewImages) as string[]
        const updatedPaths = paths.map((p: string) => {
          if (p.includes('/uploads/previews/')) {
            const filename = p.split('/').pop()
            return `${R2_PUBLIC_URL}/previews/${filename}`
          }
          return p
        })
        previewImages = JSON.stringify(updatedPaths)
      } catch {
        // Not valid JSON, leave as is
      }
    }

    if (isDryRun) {
      console.log(`  🔍 [DRY RUN] Would update skin ${skin.id}: filePath → ${r2Key}`)
      updated++
      continue
    }

    await prisma.customSkin.update({
      where: { id: skin.id },
      data: {
        filePath: r2Key,
        previewImages: previewImages,
      }
    })
    console.log(`  ✅ Updated skin ${skin.id}: ${skin.name}`)
    updated++
  }

  console.log(`  📊 Updated ${updated} custom skins`)
}

async function updateSkinSubmissionRecords(): Promise<void> {
  console.log('\n📝 Updating skin submission database records...')
  
  const submissions = await prisma.skinSubmission.findMany()

  let updated = 0
  for (const sub of submissions) {
    if (!sub.filePath || !sub.filePath.includes('/uploads/')) continue

    const r2Key = sub.filePath.split('/uploads/').pop() || sub.filePath
    
    let previewImages = sub.previewImages
    if (previewImages && typeof previewImages === 'string') {
      try {
        const paths = JSON.parse(previewImages) as string[]
        const updatedPaths = paths.map((p: string) => {
          if (p.includes('/uploads/previews/')) {
            const filename = p.split('/').pop()
            return `${R2_PUBLIC_URL}/previews/${filename}`
          }
          return p
        })
        previewImages = JSON.stringify(updatedPaths)
      } catch {
        // Not valid JSON, leave as is
      }
    }

    if (isDryRun) {
      console.log(`  🔍 [DRY RUN] Would update submission ${sub.id}: filePath → ${r2Key}`)
      updated++
      continue
    }

    await prisma.skinSubmission.update({
      where: { id: sub.id },
      data: {
        filePath: r2Key,
        previewImages: previewImages,
      }
    })
    console.log(`  ✅ Updated submission ${sub.id}: ${sub.name}`)
    updated++
  }

  console.log(`  📊 Updated ${updated} submissions`)
}

async function main() {
  console.log('🚀 R2 Migration Script')
  console.log(`   Mode: ${isDryRun ? '🔍 DRY RUN (no changes)' : '⚡ LIVE'}`)
  console.log(`   Bucket: ${R2_BUCKET_NAME}`)
  console.log(`   CDN URL: ${R2_PUBLIC_URL}`)
  console.log('')

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.error('❌ Missing R2 environment variables. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY')
    process.exit(1)
  }

  const baseDir = process.cwd()
  const results: Record<string, MigrationResult> = {}

  // 1. Migrate software files
  console.log('\n📦 Migrating software files...')
  results.software = await migrateDirectory(
    join(baseDir, 'uploads', 'software'),
    'software',
    'Software'
  )

  // 2. Migrate skin files
  console.log('\n🎨 Migrating skin files...')
  results.skins = await migrateDirectory(
    join(baseDir, 'uploads', 'skins'),
    'skins',
    'Skins'
  )

  // 3. Migrate preview images
  console.log('\n🖼️  Migrating preview images...')
  results.previews = await migrateDirectory(
    join(baseDir, 'uploads', 'previews'),
    'previews',
    'Previews'
  )
  // Also check public/uploads/previews
  const publicPreviews = await migrateDirectory(
    join(baseDir, 'public', 'uploads', 'previews'),
    'previews',
    'Public Previews'
  )
  results.previews.total += publicPreviews.total
  results.previews.uploaded += publicPreviews.uploaded
  results.previews.skipped += publicPreviews.skipped
  results.previews.failed += publicPreviews.failed

  // 4. Migrate product images  
  console.log('\n📸 Migrating product images...')
  results.productImages = await migrateDirectory(
    join(baseDir, 'uploads', 'images', 'products'),
    'images/products',
    'Product Images'
  )

  // 5. Also check public/uploads/skins
  console.log('\n🎨 Migrating public skin files...')
  const publicSkins = await migrateDirectory(
    join(baseDir, 'public', 'uploads', 'skins'),
    'skins',
    'Public Skins'
  )
  results.skins.total += publicSkins.total
  results.skins.uploaded += publicSkins.uploaded
  results.skins.skipped += publicSkins.skipped
  results.skins.failed += publicSkins.failed

  // 6. Update database records
  await updateProductRecords()
  await updateProductImageRecords()
  await updateCustomSkinRecords()
  await updateSkinSubmissionRecords()

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Migration Summary')
  console.log('='.repeat(60))
  
  let grandTotal = 0
  let grandUploaded = 0
  let grandSkipped = 0
  let grandFailed = 0

  for (const [category, result] of Object.entries(results)) {
    console.log(`  ${category}: ${result.uploaded} uploaded, ${result.skipped} skipped, ${result.failed} failed (${result.total} total)`)
    grandTotal += result.total
    grandUploaded += result.uploaded
    grandSkipped += result.skipped
    grandFailed += result.failed
  }

  console.log('─'.repeat(60))
  console.log(`  TOTAL: ${grandUploaded} uploaded, ${grandSkipped} skipped, ${grandFailed} failed (${grandTotal} total)`)
  
  if (isDryRun) {
    console.log('\n💡 This was a dry run. Run without --dry-run to perform actual migration.')
  } else {
    console.log('\n✅ Migration complete!')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

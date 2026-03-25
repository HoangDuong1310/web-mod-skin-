/**
 * Quick fix: Update product image URLs from local paths to R2 CDN URLs
 * 
 * Usage: npx tsx scripts/fix-product-images-r2.ts [--dry-run]
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const isDryRun = process.argv.includes('--dry-run')
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://cdn.modskinslol.com'

async function main() {
  console.log(`🔧 Fix Product Image URLs → R2 CDN`)
  console.log(`   Mode: ${isDryRun ? '🔍 DRY RUN' : '⚡ LIVE'}`)
  console.log(`   CDN URL: ${R2_PUBLIC_URL}\n`)

  const products = await prisma.product.findMany({
    where: { images: { not: null } }
  })

  let updated = 0
  let skipped = 0

  for (const product of products) {
    const images = product.images as string | null
    if (!images) continue

    try {
      const parsed = JSON.parse(images) as string[]
      let changed = false
      const updatedImages = parsed.map((url: string) => {
        if (url.includes('/api/uploads/images/products/') || url.includes('/uploads/images/products/')) {
          const filename = url.split('/').pop()
          if (filename) {
            changed = true
            return `${R2_PUBLIC_URL}/images/products/${filename}`
          }
        }
        return url
      })

      if (!changed) {
        skipped++
        continue
      }

      console.log(`  Product: ${product.title} (${product.id})`)
      parsed.forEach((old, i) => {
        if (old !== updatedImages[i]) {
          console.log(`    OLD: ${old}`)
          console.log(`    NEW: ${updatedImages[i]}`)
        }
      })

      if (!isDryRun) {
        await prisma.product.update({
          where: { id: product.id },
          data: { images: JSON.stringify(updatedImages) }
        })
        console.log(`    ✅ Updated`)
      } else {
        console.log(`    🔍 [DRY RUN] Would update`)
      }
      updated++
    } catch {
      console.log(`  ⚠️  Could not parse images for product ${product.id}, skipping`)
    }
  }

  console.log(`\n📊 Results: ${updated} updated, ${skipped} already correct`)
  if (isDryRun) {
    console.log('💡 Run without --dry-run to apply changes')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

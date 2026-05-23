/**
 * Mark Founders Script
 * 
 * Identifies all users who have at least one COMPLETED order and marks them
 * as Founders with the appropriate tier based on their highest purchased plan.
 * 
 * Usage:
 *   npx tsx scripts/mark-founders.ts
 *   npx tsx scripts/mark-founders.ts --dry-run   (preview without writing)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Map plan duration types to tier hierarchy (higher = better)
const TIER_PRIORITY: Record<string, number> = {
  LIFETIME: 100,
  YEAR: 80,
  QUARTER: 60,
  MONTH: 40,
  WEEK: 20,
  DAY: 10,
  HOUR: 5,
}

function determineTier(durationType: string): string {
  if (durationType === 'LIFETIME') return 'LIFETIME'
  if (['YEAR', 'QUARTER'].includes(durationType)) return 'PRO'
  return 'BASIC'
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run')

  console.log('🏆 Mark Founders Script')
  console.log(`   Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE (will update DB)'}`)
  console.log('─'.repeat(60))

  // Find all users with at least one completed order.
  // Cast result type until `prisma generate` is run after the migration.
  const usersWithOrders = (await prisma.user.findMany({
    where: {
      orders: {
        some: {
          paymentStatus: 'COMPLETED',
        },
      },
    },
    include: {
      orders: {
        where: { paymentStatus: 'COMPLETED' },
        include: { plan: true },
        orderBy: { completedAt: 'asc' },
      },
    },
  })) as unknown as Array<{
    id: string
    email: string
    isFounder: boolean
    orders: Array<{
      completedAt: Date | null
      createdAt: Date
      plan: { durationType: string }
    }>
  }>

  console.log(`\n📊 Found ${usersWithOrders.length} users with completed orders\n`)

  let updated = 0
  let alreadyFounder = 0
  let errors = 0

  for (const user of usersWithOrders) {
    // Determine the highest tier from all their orders
    let highestPriority = 0
    let bestTier = 'BASIC'
    let earliestOrder: Date | null = null

    for (const order of user.orders) {
      const priority = TIER_PRIORITY[order.plan.durationType] || 0
      if (priority > highestPriority) {
        highestPriority = priority
        bestTier = determineTier(order.plan.durationType)
      }
      // Track earliest completed order date
      const orderDate = order.completedAt || order.createdAt
      if (!earliestOrder || orderDate < earliestOrder) {
        earliestOrder = orderDate
      }
    }

    if (user.isFounder) {
      alreadyFounder++
      continue
    }

    console.log(
      `  ✓ ${user.email} → tier=${bestTier}, since=${earliestOrder?.toISOString().slice(0, 10)}, orders=${user.orders.length}`
    )

    if (!isDryRun) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            isFounder: true,
            founderSince: earliestOrder,
            founderTier: bestTier,
          },
        })
        updated++
      } catch (err) {
        console.error(`  ✗ Failed to update ${user.email}:`, err)
        errors++
      }
    } else {
      updated++
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log('📋 Summary:')
  console.log(`   Total users with orders: ${usersWithOrders.length}`)
  console.log(`   Already marked as Founder: ${alreadyFounder}`)
  console.log(`   ${isDryRun ? 'Would update' : 'Updated'}: ${updated}`)
  if (errors > 0) console.log(`   Errors: ${errors}`)
  console.log('')

  if (isDryRun) {
    console.log('💡 Run without --dry-run to apply changes')
  } else {
    console.log('✅ Done! All eligible users have been marked as Founders.')
  }
}

main()
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

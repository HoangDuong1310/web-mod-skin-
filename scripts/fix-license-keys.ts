/**
 * Script to fix existing license keys with incorrect maxDevices and expiresAt
 * 
 * This script will:
 * 1. Find all license keys that need fixing
 * 2. Update maxDevices from their plan
 * 3. Recalculate expiresAt based on plan duration and activatedAt
 * 
 * Usage:
 *   npx tsx scripts/fix-license-keys.ts
 *   or
 *   npm run fix-license-keys
 */

import { PrismaClient } from '@prisma/client'
import { calculateExpirationDate } from '../lib/license-key'

const prisma = new PrismaClient()

async function main() {
    console.log('🔧 Starting license key fix script...\n')

    try {
        // Fetch all license keys with their plan info
        const licenseKeys = await prisma.licenseKey.findMany({
            where: {
                status: {
                    in: ['ACTIVE', 'INACTIVE', 'EXPIRED']
                }
            },
            include: {
                plan: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        console.log(`📊 Found ${licenseKeys.length} license keys to check\n`)

        let fixedCount = 0
        let skippedCount = 0
        let errorCount = 0

        for (const key of licenseKeys) {
            try {
                const needsUpdate = {
                    maxDevices: false,
                    expiresAt: false
                }

                const updates: any = {}

                // ALWAYS check if maxDevices needs fixing (regardless of activation status)
                if (key.maxDevices !== key.plan.maxDevices) {
                    needsUpdate.maxDevices = true
                    updates.maxDevices = key.plan.maxDevices
                    console.log(`  ⚠️  Key ${key.key}: maxDevices ${key.maxDevices} → ${key.plan.maxDevices}`)
                }

                // Check if expiresAt needs fixing (only for activated keys)
                if (key.activatedAt && key.plan.durationType !== 'LIFETIME') {
                    const correctExpiresAt = calculateExpirationDate(
                        key.plan.durationType,
                        key.plan.durationValue,
                        key.activatedAt
                    )

                    // Compare dates (allow 1 minute tolerance for rounding)
                    const currentExpiry = key.expiresAt?.getTime() || 0
                    const correctExpiry = correctExpiresAt?.getTime() || 0
                    const diff = Math.abs(currentExpiry - correctExpiry)

                    if (diff > 60000) { // More than 1 minute difference
                        needsUpdate.expiresAt = true
                        updates.expiresAt = correctExpiresAt
                        console.log(`  ⚠️  Key ${key.key}: expiresAt ${key.expiresAt} → ${correctExpiresAt}`)
                    }
                }

                // Check LIFETIME keys
                if (key.plan.durationType === 'LIFETIME' && key.expiresAt !== null) {
                    needsUpdate.expiresAt = true
                    updates.expiresAt = null
                    console.log(`  ⚠️  Key ${key.key}: Setting to LIFETIME (null expiry)`)
                }

                // Update if needed
                if (needsUpdate.maxDevices || needsUpdate.expiresAt) {
                    await prisma.licenseKey.update({
                        where: { id: key.id },
                        data: updates
                    })

                    const updatedFields = []
                    if (needsUpdate.maxDevices) updatedFields.push('maxDevices')
                    if (needsUpdate.expiresAt) updatedFields.push('expiresAt')

                    console.log(`  ✅ Fixed key ${key.key} (updated: ${updatedFields.join(', ')})`)
                    fixedCount++
                } else {
                    skippedCount++
                }

            } catch (error) {
                console.error(`  ❌ Error fixing key ${key.key}:`, error)
                errorCount++
            }
        }

        console.log('\n📈 Summary:')
        console.log(`  ✅ Fixed: ${fixedCount}`)
        console.log(`  ⏭️  Skipped (already correct): ${skippedCount}`)
        console.log(`  ❌ Errors: ${errorCount}`)
        console.log('\n✨ Script completed!')

    } catch (error) {
        console.error('❌ Fatal error:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

// Run the script
main()
    .catch((error) => {
        console.error('Unhandled error:', error)
        process.exit(1)
    })

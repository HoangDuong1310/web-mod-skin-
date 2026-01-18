/**
 * Script to check license keys and their maxDevices values
 * This will show which keys have incorrect maxDevices
 * 
 * Usage:
 *   npx tsx scripts/check-license-keys.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Checking license keys...\n')

    try {
        // Get all license keys with plan info
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

        console.log(`📊 Total keys: ${licenseKeys.length}\n`)

        // Group by issues
        const incorrectMaxDevices: any[] = []
        const incorrectExpiresAt: any[] = []
        const correctKeys: any[] = []

        for (const key of licenseKeys) {
            const issues = []

            // Check maxDevices
            if (key.maxDevices !== key.plan.maxDevices) {
                issues.push(`maxDevices: ${key.maxDevices} (should be ${key.plan.maxDevices})`)
                incorrectMaxDevices.push({
                    key: key.key,
                    plan: key.plan.name,
                    current: key.maxDevices,
                    expected: key.plan.maxDevices,
                    status: key.status,
                    activatedAt: key.activatedAt
                })
            }

            // Check expiresAt for LIFETIME
            if (key.plan.durationType === 'LIFETIME' && key.expiresAt !== null) {
                issues.push(`expiresAt should be null for LIFETIME`)
                incorrectExpiresAt.push({
                    key: key.key,
                    plan: key.plan.name,
                    issue: 'Should be null for LIFETIME'
                })
            }

            if (issues.length === 0) {
                correctKeys.push(key)
            } else {
                console.log(`❌ ${key.key} (${key.plan.name}):`)
                issues.forEach(issue => console.log(`   - ${issue}`))
            }
        }

        console.log('\n' + '='.repeat(60))
        console.log('📈 SUMMARY')
        console.log('='.repeat(60))
        console.log(`✅ Correct keys: ${correctKeys.length}`)
        console.log(`❌ Keys with wrong maxDevices: ${incorrectMaxDevices.length}`)
        console.log(`❌ Keys with wrong expiresAt: ${incorrectExpiresAt.length}`)

        if (incorrectMaxDevices.length > 0) {
            console.log('\n' + '='.repeat(60))
            console.log('⚠️  KEYS WITH INCORRECT maxDevices:')
            console.log('='.repeat(60))

            incorrectMaxDevices.forEach(item => {
                console.log(`Key: ${item.key}`)
                console.log(`  Plan: ${item.plan}`)
                console.log(`  Current maxDevices: ${item.current}`)
                console.log(`  Expected maxDevices: ${item.expected}`)
                console.log(`  Status: ${item.status}`)
                console.log(`  Activated: ${item.activatedAt || 'Not activated yet'}`)
                console.log('')
            })
        }

        console.log('\n' + '='.repeat(60))
        console.log('💡 RECOMMENDATION:')
        console.log('='.repeat(60))
        if (incorrectMaxDevices.length > 0 || incorrectExpiresAt.length > 0) {
            console.log('Run the fix script to correct these issues:')
            console.log('  npm run fix-license-keys')
        } else {
            console.log('All license keys are correct! 🎉')
        }

    } catch (error) {
        console.error('❌ Error:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
    .catch((error) => {
        console.error('Unhandled error:', error)
        process.exit(1)
    })

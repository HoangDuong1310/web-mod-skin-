/**
 * Seed script to create the Free Key 4-Hour subscription plan
 * Run with: npx tsx scripts/seed-free-key-plan.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Creating Free Key 4-Hour Plan...')

    // Check if plan already exists
    const existingPlan = await prisma.subscriptionPlan.findUnique({
        where: { slug: 'free-key-4h' }
    })

    if (existingPlan) {
        console.log('✅ Free Key 4-Hour Plan already exists:', existingPlan.id)
        return existingPlan
    }

    // Create the plan
    const plan = await prisma.subscriptionPlan.create({
        data: {
            name: 'Free Key 4 Giờ',
            nameEn: 'Free Key 4 Hours',
            slug: 'free-key-4h',
            description: 'Key miễn phí 4 tiếng cho người dùng vượt quảng cáo',
            descriptionEn: 'Free 4-hour key for users who complete ad bypass',

            // Pricing (free)
            price: 0,
            currency: 'VND',
            priceUsd: 0,

            // Duration: 4 hours
            durationType: 'HOUR',
            durationValue: 4,

            // Features
            features: JSON.stringify([
                'Sử dụng trong 4 giờ',
                'Giới hạn 1 thiết bị',
                'Nhận miễn phí qua vượt quảng cáo'
            ]),
            featuresEn: JSON.stringify([
                'Valid for 4 hours',
                'Limited to 1 device',
                'Free via ad bypass'
            ]),

            // Limits
            maxDevices: 1,

            // Display settings
            isActive: true,
            isPopular: false,
            isFeatured: false,
            priority: 0,
            color: '#6B7280' // Gray color
        }
    })

    console.log('✅ Created Free Key 4-Hour Plan:', plan.id)
    return plan
}

main()
    .catch((e) => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

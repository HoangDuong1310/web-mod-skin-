/**
 * Create a test session for demo purposes
 * This simulates a completed ad bypass so you can see the claim page
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestSession() {
    // Find a product with free key enabled
    const product = await prisma.product.findFirst({
        where: {
            requiresKey: true,
            freeKeyPlanId: { not: null }
        }
    })

    if (!product) {
        console.log('❌ No product with free key enabled found!')
        console.log('Please enable requiresKey and select freeKeyPlan for a product first.')
        return
    }

    const token = 'test-demo-' + Date.now()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 min

    const session = await prisma.freeKeySession.create({
        data: {
            token,
            productId: product.id,
            ipAddress: '127.0.0.1',
            status: 'COMPLETED',
            completedAt: new Date(),
            expiresAt
        }
    })

    console.log('✅ Test session created!')
    console.log('📦 Product:', product.title)
    console.log('')
    console.log('🔗 Open this URL to see claim page:')
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    console.log(`${baseUrl}/free-key/claim?token=${token}`)
}

createTestSession()
    .catch(console.error)
    .finally(() => prisma.$disconnect())

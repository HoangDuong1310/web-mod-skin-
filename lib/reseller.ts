import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { generateKeyString, calculateExpirationDate } from '@/lib/license-key'

// ============================================
// RESELLER API KEY GENERATION
// ============================================

const API_KEY_PREFIX = 'rsk_'
const API_KEY_LENGTH = 40

/**
 * Generate a unique reseller API key
 * Format: rsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 */
export function generateResellerApiKey(): string {
  const randomBytes = crypto.randomBytes(API_KEY_LENGTH)
  const key = randomBytes.toString('hex').slice(0, API_KEY_LENGTH)
  return `${API_KEY_PREFIX}${key}`
}

// ============================================
// RESELLER AUTHENTICATION
// ============================================

/**
 * Authenticate a reseller by API key
 * Returns reseller data if valid, null if invalid
 */
export async function authenticateReseller(apiKey: string) {
  if (!apiKey || !apiKey.startsWith(API_KEY_PREFIX)) {
    return null
  }

  const resellerApiKey = await prisma.resellerApiKey.findUnique({
    where: { apiKey },
    include: {
      reseller: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          freeKeyPlan: true,
        },
      },
    },
  })

  if (!resellerApiKey) return null
  if (!resellerApiKey.isActive) return null
  if (resellerApiKey.expiresAt && new Date() > resellerApiKey.expiresAt) return null
  if (resellerApiKey.reseller.status !== 'APPROVED') return null
  if (resellerApiKey.reseller.deletedAt) return null

  // Update last used
  await prisma.resellerApiKey.update({
    where: { id: resellerApiKey.id },
    data: {
      lastUsedAt: new Date(),
      lastUsedIp: undefined, // Will be set by the API route
    },
  })

  return resellerApiKey.reseller
}

/**
 * Update last used IP for API key
 */
export async function updateApiKeyLastUsed(apiKey: string, ip: string) {
  await prisma.resellerApiKey.update({
    where: { apiKey },
    data: {
      lastUsedAt: new Date(),
      lastUsedIp: ip,
    },
  })
}

// ============================================
// FREE KEY QUOTA CHECKING
// ============================================

/**
 * Get the number of free keys generated today by a reseller
 */
export async function getResellerFreeKeyCountToday(resellerId: string): Promise<number> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const count = await prisma.resellerKeyAllocation.count({
    where: {
      resellerId,
      type: 'FREE',
      allocatedAt: {
        gte: startOfDay,
      },
    },
  })

  return count
}

/**
 * Get the number of free keys generated this month by a reseller
 */
export async function getResellerFreeKeyCountMonth(resellerId: string): Promise<number> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const count = await prisma.resellerKeyAllocation.count({
    where: {
      resellerId,
      type: 'FREE',
      allocatedAt: {
        gte: startOfMonth,
      },
    },
  })

  return count
}

/**
 * Check if reseller can generate more free keys
 * Returns { allowed: boolean, reason?: string, remaining?: { daily, monthly } }
 */
export async function checkFreeKeyQuota(resellerId: string) {
  const reseller = await prisma.reseller.findUnique({
    where: { id: resellerId },
  })

  if (!reseller) {
    return { allowed: false, reason: 'Reseller not found' }
  }

  if (reseller.status !== 'APPROVED') {
    return { allowed: false, reason: 'Reseller account not approved' }
  }

  const dailyCount = await getResellerFreeKeyCountToday(resellerId)
  const monthlyCount = await getResellerFreeKeyCountMonth(resellerId)

  // Check daily quota (0 = unlimited)
  if (reseller.freeKeyQuotaDaily > 0 && dailyCount >= reseller.freeKeyQuotaDaily) {
    return {
      allowed: false,
      reason: `Daily quota exceeded (${dailyCount}/${reseller.freeKeyQuotaDaily})`,
      remaining: {
        daily: 0,
        monthly: reseller.freeKeyQuotaMonthly > 0
          ? Math.max(0, reseller.freeKeyQuotaMonthly - monthlyCount)
          : -1, // -1 = unlimited
      },
    }
  }

  // Check monthly quota (0 = unlimited)
  if (reseller.freeKeyQuotaMonthly > 0 && monthlyCount >= reseller.freeKeyQuotaMonthly) {
    return {
      allowed: false,
      reason: `Monthly quota exceeded (${monthlyCount}/${reseller.freeKeyQuotaMonthly})`,
      remaining: {
        daily: reseller.freeKeyQuotaDaily > 0
          ? Math.max(0, reseller.freeKeyQuotaDaily - dailyCount)
          : -1,
        monthly: 0,
      },
    }
  }

  return {
    allowed: true,
    remaining: {
      daily: reseller.freeKeyQuotaDaily > 0
        ? reseller.freeKeyQuotaDaily - dailyCount
        : -1,
      monthly: reseller.freeKeyQuotaMonthly > 0
        ? reseller.freeKeyQuotaMonthly - monthlyCount
        : -1,
    },
  }
}

// ============================================
// KEY GENERATION FOR RESELLERS
// ============================================

/**
 * Generate a free key for a reseller
 */
export async function generateResellerFreeKey(resellerId: string) {
  const reseller = await prisma.reseller.findUnique({
    where: { id: resellerId },
    include: {
      freeKeyPlan: true,
    },
  })

  if (!reseller) {
    throw new Error('Reseller not found')
  }

  if (!reseller.freeKeyPlan) {
    throw new Error('Free key plan not configured for this reseller. Contact admin.')
  }

  // Check quota
  const quotaCheck = await checkFreeKeyQuota(resellerId)
  if (!quotaCheck.allowed) {
    throw new Error(quotaCheck.reason)
  }

  const plan = reseller.freeKeyPlan

  // Generate unique key
  let key = generateKeyString()
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const existing = await prisma.licenseKey.findUnique({
      where: { key },
    })
    if (!existing) break
    key = generateKeyString()
    attempts++
  }

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique key. Please try again.')
  }

  // Calculate expiration
  const now = new Date(Date.now())
  const expiresAt = calculateExpirationDate(
    plan.durationType as 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR' | 'LIFETIME',
    plan.durationValue,
    now
  )

  // Create key and allocation in transaction
  const result = await prisma.$transaction(async (tx) => {
    const licenseKey = await tx.licenseKey.create({
      data: {
        key,
        planId: plan.id,
        status: 'INACTIVE',
        maxDevices: plan.maxDevices || 1,
        expiresAt,
        notes: `Reseller free key. Reseller: ${reseller.businessName}`,
        createdBy: `RESELLER_${reseller.id}`,
      },
    })

    await tx.resellerKeyAllocation.create({
      data: {
        resellerId,
        licenseKeyId: licenseKey.id,
        type: 'FREE',
      },
    })

    return licenseKey
  })

  return {
    key: result.key,
    expiresAt: result.expiresAt,
    maxDevices: result.maxDevices,
    plan: {
      name: plan.name,
      durationType: plan.durationType,
      durationValue: plan.durationValue,
    },
  }
}

/**
 * Purchase keys for a reseller (deducts balance)
 */
export async function purchaseResellerKeys(params: {
  resellerId: string
  planId: string
  quantity: number
}) {
  const { resellerId, planId, quantity } = params

  const reseller = await prisma.reseller.findUnique({
    where: { id: resellerId },
  })

  if (!reseller) throw new Error('Reseller not found')
  if (reseller.status !== 'APPROVED') throw new Error('Reseller account not approved')
  if (quantity < 1) throw new Error('Quantity must be at least 1')
  if (quantity > reseller.maxKeysPerOrder) {
    throw new Error(`Maximum ${reseller.maxKeysPerOrder} keys per order`)
  }

  // Get plan
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  })

  if (!plan || !plan.isActive) throw new Error('Plan not found or inactive')

  // Calculate price with discount
  const unitPrice = Number(plan.price)
  const discountAmount = unitPrice * (reseller.discountPercent / 100)
  const discountedUnitPrice = unitPrice - discountAmount
  const totalCost = discountedUnitPrice * quantity

  // Check balance
  const currentBalance = Number(reseller.balance)
  if (currentBalance < totalCost) {
    throw new Error(
      `Insufficient balance. Required: ${totalCost.toLocaleString()} ${reseller.currency}, Available: ${currentBalance.toLocaleString()} ${reseller.currency}`
    )
  }

  // Generate keys and process payment in transaction
  const result = await prisma.$transaction(async (tx) => {
    const generatedKeys: { key: string; expiresAt: Date | null }[] = []

    for (let i = 0; i < quantity; i++) {
      // Generate unique key
      let key = generateKeyString()
      let attempts = 0
      while (attempts < 10) {
        const existing = await tx.licenseKey.findUnique({
          where: { key },
        })
        if (!existing) break
        key = generateKeyString()
        attempts++
      }

      const now = new Date(Date.now())
      const expiresAt = calculateExpirationDate(
        plan.durationType as 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR' | 'LIFETIME',
        plan.durationValue,
        now
      )

      const licenseKey = await tx.licenseKey.create({
        data: {
          key,
          planId: plan.id,
          status: 'INACTIVE',
          maxDevices: plan.maxDevices || 1,
          expiresAt,
          notes: `Reseller purchase. Reseller: ${reseller.businessName}`,
          createdBy: `RESELLER_${reseller.id}`,
        },
      })

      await tx.resellerKeyAllocation.create({
        data: {
          resellerId,
          licenseKeyId: licenseKey.id,
          type: 'PURCHASED',
        },
      })

      generatedKeys.push({
        key: licenseKey.key,
        expiresAt: licenseKey.expiresAt,
      })
    }

    // Deduct balance
    const newBalance = currentBalance - totalCost
    await tx.reseller.update({
      where: { id: resellerId },
      data: {
        balance: newBalance,
        totalSpent: { increment: totalCost },
      },
    })

    // Create transaction record
    await tx.resellerTransaction.create({
      data: {
        resellerId,
        type: 'PURCHASE_KEY',
        amount: -totalCost,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description: `Purchased ${quantity}x ${plan.name} keys`,
        planId: plan.id,
        quantity,
        unitPrice: discountedUnitPrice,
        discount: discountAmount * quantity,
      },
    })

    return {
      keys: generatedKeys,
      totalCost,
      balanceAfter: newBalance,
    }
  })

  return {
    keys: result.keys,
    plan: {
      name: plan.name,
      durationType: plan.durationType,
      durationValue: plan.durationValue,
    },
    quantity,
    unitPrice: discountedUnitPrice,
    totalCost: result.totalCost,
    discount: reseller.discountPercent,
    balanceAfter: result.balanceAfter,
    currency: reseller.currency,
  }
}

// ============================================
// RESELLER STATS
// ============================================

/**
 * Get reseller statistics
 */
export async function getResellerStats(resellerId: string) {
  const [
    totalKeys,
    purchasedKeys,
    freeKeys,
    todayFreeKeys,
    monthFreeKeys,
    reseller,
  ] = await Promise.all([
    prisma.resellerKeyAllocation.count({ where: { resellerId } }),
    prisma.resellerKeyAllocation.count({ where: { resellerId, type: 'PURCHASED' } }),
    prisma.resellerKeyAllocation.count({ where: { resellerId, type: 'FREE' } }),
    getResellerFreeKeyCountToday(resellerId),
    getResellerFreeKeyCountMonth(resellerId),
    prisma.reseller.findUnique({
      where: { id: resellerId },
      select: {
        balance: true,
        totalSpent: true,
        freeKeyQuotaDaily: true,
        freeKeyQuotaMonthly: true,
        discountPercent: true,
        currency: true,
      },
    }),
  ])

  return {
    totalKeys,
    purchasedKeys,
    freeKeys,
    quota: {
      daily: {
        used: todayFreeKeys,
        limit: reseller?.freeKeyQuotaDaily || 0,
        remaining: reseller?.freeKeyQuotaDaily
          ? Math.max(0, reseller.freeKeyQuotaDaily - todayFreeKeys)
          : -1,
      },
      monthly: {
        used: monthFreeKeys,
        limit: reseller?.freeKeyQuotaMonthly || 0,
        remaining: reseller?.freeKeyQuotaMonthly
          ? Math.max(0, reseller.freeKeyQuotaMonthly - monthFreeKeys)
          : -1,
      },
    },
    balance: Number(reseller?.balance || 0),
    totalSpent: Number(reseller?.totalSpent || 0),
    discountPercent: reseller?.discountPercent || 0,
    currency: reseller?.currency || 'VND',
  }
}

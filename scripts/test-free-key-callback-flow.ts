/**
 * Test script: verify free-key callback flow end-to-end.
 *
 * What it does:
 * 1. Find a product that supports free key.
 * 2. Create a temporary free-key session in DB.
 * 3. Build the callback URL with token + secret.
 * 4. Request the callback endpoint using a real HTTP call.
 * 5. Verify whether the callback redirects to /free-key/claim or /free-key/success.
 *
 * Run:
 *   npx tsx scripts/test-free-key-callback-flow.ts
 *
 * Optional env overrides:
 *   TEST_FREE_KEY_BASE_URL=https://modskinslol.com
 *   KEEP_TEST_FREE_KEY_SESSION=1
 */

import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'
import { getSEOSettings } from '../lib/dynamic-seo'

const prisma = new PrismaClient()

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
}

function info(message: string) {
  console.log(`${colors.cyan}[INFO]${colors.reset} ${message}`)
}

function warn(message: string) {
  console.log(`${colors.yellow}[WARN]${colors.reset} ${message}`)
}

function pass(message: string) {
  console.log(`${colors.green}[PASS]${colors.reset} ${message}`)
}

function fail(message: string) {
  console.log(`${colors.red}[FAIL]${colors.reset} ${message}`)
}

function section(title: string) {
  console.log(`\n${colors.bold}${colors.blue}=== ${title} ===${colors.reset}`)
}

async function resolveBaseUrl() {
  const manualBaseUrl = process.env.TEST_FREE_KEY_BASE_URL?.trim()
  if (manualBaseUrl) {
    return manualBaseUrl.replace(/\/+$/, '')
  }

  try {
    const settings = await getSEOSettings()
    const configuredSiteUrl = settings.siteUrl?.trim()
    if (configuredSiteUrl && /^https?:\/\//i.test(configuredSiteUrl)) {
      return configuredSiteUrl.replace(/\/+$/, '')
    }
  } catch (error) {
    warn(`Failed to load SEO settings: ${error instanceof Error ? error.message : String(error)}`)
  }

  const envBaseUrl = process.env.APP_URL?.trim() || process.env.NEXTAUTH_URL?.trim()
  if (envBaseUrl && /^https?:\/\//i.test(envBaseUrl)) {
    return envBaseUrl.replace(/\/+$/, '')
  }

  return 'http://localhost:3000'
}

async function main() {
  section('FREE KEY CALLBACK FLOW TEST')

  const baseUrl = await resolveBaseUrl()
  info(`Resolved base URL: ${baseUrl}`)

  let cleanupProductId: string | null = null
  let cleanupPlanId: string | null = null

  let product = await prisma.product.findFirst({
    where: {
      requiresKey: true,
      freeKeyPlanId: { not: null },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      freeKeyPlanId: true,
    },
  })

  if (!product) {
    warn('No product with free key enabled found, creating temporary plan + product for test')

    const uniqueSuffix = Date.now().toString()
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: `Test Free Key Plan ${uniqueSuffix}`,
        slug: `test-free-key-plan-${uniqueSuffix}`,
        description: 'Temporary plan for free key callback flow test',
        price: 0,
        durationType: 'HOUR',
        durationValue: 4,
        maxDevices: 1,
        isActive: true,
      },
      select: {
        id: true,
      },
    })

    cleanupPlanId = plan.id

    product = await prisma.product.create({
      data: {
        title: `Test Free Key Product ${uniqueSuffix}`,
        slug: `test-free-key-product-${uniqueSuffix}`,
        description: 'Temporary product for free key callback flow test',
        price: 0,
        requiresKey: true,
        adBypassEnabled: true,
        freeKeyPlanId: plan.id,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        freeKeyPlanId: true,
      },
    })

    cleanupProductId = product.id
  }

  info(`Using product: ${product.title} (${product.slug})`)

  const token = crypto.randomBytes(32).toString('hex')
  const secret = crypto.randomBytes(16).toString('hex')
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

  const session = await prisma.freeKeySession.create({
    data: {
      token,
      callbackSecret: secret,
      productId: product.id,
      ipAddress: '127.0.0.1',
      userAgent: 'test-free-key-callback-flow',
      status: 'PENDING',
      expiresAt,
    },
    select: {
      id: true,
      token: true,
      status: true,
      expiresAt: true,
    },
  })

  info(`Created test session: ${session.id}`)
  info(`Session token: ${session.token.slice(0, 16)}...`)

  const callbackUrl = `${baseUrl}/api/free-key/callback?token=${token}&secret=${secret}`
  const claimUrl = `${baseUrl}/free-key/claim?token=${token}`
  const successUrl = `${baseUrl}/free-key/success?token=${token}`

  section('CALLBACK REQUEST')
  info(`Requesting: ${callbackUrl}`)

  let response: Response
  try {
    response = await fetch(callbackUrl, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'user-agent': 'test-free-key-callback-flow',
      },
    })
  } catch (error) {
    fail(`Could not reach callback URL: ${error instanceof Error ? error.message : String(error)}`)
    console.log(`${colors.gray}Tip: start the app first or set TEST_FREE_KEY_BASE_URL to your live domain.${colors.reset}`)
    console.log(`${colors.gray}Expected claim URL after success: ${claimUrl}${colors.reset}`)
    return
  }

  const location = response.headers.get('location')
  info(`HTTP status: ${response.status}`)
  info(`Location header: ${location || '(none)'}`)

  const updatedSession = await prisma.freeKeySession.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      status: true,
      completedAt: true,
      claimedAt: true,
      callbackSecret: true,
    },
  })

  section('RESULT')

  if (!updatedSession) {
    fail('Test session disappeared unexpectedly')
    return
  }

  info(`DB session status: ${updatedSession.status}`)

  const redirectedToClaim = location === claimUrl || location?.endsWith(`/free-key/claim?token=${token}`)
  const redirectedToSuccess = location === successUrl || location?.endsWith(`/free-key/success?token=${token}`)
  const redirectedToError = location?.includes('/free-key/error')

  if ((response.status === 302 || response.status === 307 || response.status === 308) && redirectedToClaim && updatedSession.status === 'COMPLETED') {
    pass('Callback flow is working: redirected to claim page and DB status changed to COMPLETED')
    console.log(`${colors.green}Claim URL:${colors.reset} ${claimUrl}`)
  } else if ((response.status === 302 || response.status === 307 || response.status === 308) && redirectedToSuccess && updatedSession.status === 'CLAIMED') {
    pass('Callback flow is working: redirected to success page and session was already claimed')
    console.log(`${colors.green}Success URL:${colors.reset} ${successUrl}`)
  } else if (redirectedToError) {
    fail(`Callback redirected to error page: ${location}`)
  } else {
    fail('Unexpected callback behavior detected')
    console.log(`${colors.gray}Expected redirect:${colors.reset} ${claimUrl}`)
  }

  const keepSession = process.env.KEEP_TEST_FREE_KEY_SESSION === '1'

  section('CLEANUP')
  if (keepSession) {
    warn('KEEP_TEST_FREE_KEY_SESSION=1 detected, keeping test session for manual inspection')
    console.log(`${colors.yellow}Manual claim URL:${colors.reset} ${claimUrl}`)
  } else {
    await prisma.freeKeySession.delete({ where: { id: session.id } })
    info('Deleted temporary test session')
  }
}

main()
  .catch((error) => {
    console.error(`${colors.red}[ERROR]${colors.reset}`, error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

# Donate-First Redesign — Implementation Plan (Sub-project 1: Donation Core)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a unified donation core (tier system, VND-first donations, VietQR + Ko-fi, auto/manual verification) and redesign the `/donate` page in minimal style.

**Architecture:** Hybrid — one Zustand store + pure tier-logic library feed a set of focused UI widgets. Donations are VND integers with a unique `transferNote` for bank matching. Tier is cumulative and event-driven on verification.

**Tech Stack:** Next.js 14 (App Router), Prisma (MySQL), Zustand, Zod, Tailwind, Vitest, React Testing Library.

**Spec:** `docs/superpowers/specs/2026-05-28-donate-first-redesign-design.md`
**Mockup:** `docs/superpowers/specs/mockups/donate-page-mockup-v2.html`

---

## File Structure

**Create:**
- `lib/donor-tiers.ts` — tier constants + pure functions
- `lib/__tests__/donor-tiers.test.ts` — tier logic tests
- `lib/transfer-note.ts` — generate/parse transfer notes
- `lib/__tests__/transfer-note.test.ts` — transfer note tests
- `lib/donation-service.ts` — verifyDonation() service (shared by webhook + admin)
- `lib/__tests__/donation-service.test.ts` — service tests
- `hooks/use-donation.ts` — new Zustand store (replaces use-donation-overlay.ts)
- `components/donation/donor-tier-badge.tsx` — tier badge widget
- `components/donation/__tests__/donor-tier-badge.test.tsx`
- `components/donation/goal-progress.tsx` — progress bar widget
- `components/donation/tier-ladder.tsx` — 3-column tier comparison
- `components/donation/donate-form.tsx` — unified form (merges 3 old forms)
- `components/donation/donor-wall.tsx` — recent donors list
- `components/donation/donate-hero.tsx` — /donate hero block
- `app/api/donations/my-tier/route.ts` — current user tier endpoint
- `app/api/donations/donor-wall/route.ts` — public recent donors
- `app/api/webhooks/bank-transfer/route.ts` — bank webhook endpoint

**Modify:**
- `prisma/schema.prisma` — User tier fields + Donation refactor + enum updates
- `app/donate/page.tsx` — replace debug page with real landing page
- `app/api/donations/route.ts` — VND-first, generate transferNote on POST

**Delete (end of plan):**
- `components/shared/donation-form.tsx`, `donation-form-new.tsx`, `donation-form-clean.tsx`
- `components/shared/donation-overlay.tsx`, `donation-provider.tsx`, `donation-trigger.tsx`, `donation-messages.tsx`
- `hooks/use-donation-overlay.ts`

---

## Task 1: Tier Logic Library

**Files:**
- Create: `lib/donor-tiers.ts`
- Test: `lib/__tests__/donor-tiers.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/donor-tiers.test.ts
import { describe, it, expect } from 'vitest'
import { calculateTier, getNextTier, TIER_THRESHOLDS, type DonorTier } from '../donor-tiers'

describe('calculateTier', () => {
  it('returns null below Bronze threshold', () => {
    expect(calculateTier(0)).toBeNull()
    expect(calculateTier(49_999)).toBeNull()
  })
  it('returns BRONZE at 50k', () => {
    expect(calculateTier(50_000)).toBe('BRONZE')
    expect(calculateTier(199_999)).toBe('BRONZE')
  })
  it('returns SILVER at 200k', () => {
    expect(calculateTier(200_000)).toBe('SILVER')
    expect(calculateTier(499_999)).toBe('SILVER')
  })
  it('returns GOLD at 500k and above', () => {
    expect(calculateTier(500_000)).toBe('GOLD')
    expect(calculateTier(10_000_000)).toBe('GOLD')
  })
})

describe('getNextTier', () => {
  it('points to BRONZE when no tier yet', () => {
    expect(getNextTier(null)).toEqual({ tier: 'BRONZE', threshold: 50_000 })
  })
  it('points to SILVER from BRONZE', () => {
    expect(getNextTier('BRONZE')).toEqual({ tier: 'SILVER', threshold: 200_000 })
  })
  it('points to GOLD from SILVER', () => {
    expect(getNextTier('SILVER')).toEqual({ tier: 'GOLD', threshold: 500_000 })
  })
  it('returns null at GOLD (max tier)', () => {
    expect(getNextTier('GOLD')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/__tests__/donor-tiers.test.ts`
Expected: FAIL with "Cannot find module '../donor-tiers'"

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/donor-tiers.ts
export type DonorTier = 'BRONZE' | 'SILVER' | 'GOLD'

export const TIER_THRESHOLDS = {
  BRONZE: 50_000,
  SILVER: 200_000,
  GOLD: 500_000,
} as const

export const TIER_ORDER: DonorTier[] = ['BRONZE', 'SILVER', 'GOLD']

export const TIER_LABELS: Record<DonorTier, string> = {
  BRONZE: 'Bronze',
  SILVER: 'Silver',
  GOLD: 'Gold',
}

export function calculateTier(totalVND: number): DonorTier | null {
  if (totalVND >= TIER_THRESHOLDS.GOLD) return 'GOLD'
  if (totalVND >= TIER_THRESHOLDS.SILVER) return 'SILVER'
  if (totalVND >= TIER_THRESHOLDS.BRONZE) return 'BRONZE'
  return null
}

export function getNextTier(
  current: DonorTier | null
): { tier: DonorTier; threshold: number } | null {
  if (current === null) return { tier: 'BRONZE', threshold: TIER_THRESHOLDS.BRONZE }
  if (current === 'BRONZE') return { tier: 'SILVER', threshold: TIER_THRESHOLDS.SILVER }
  if (current === 'SILVER') return { tier: 'GOLD', threshold: TIER_THRESHOLDS.GOLD }
  return null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/__tests__/donor-tiers.test.ts`
Expected: PASS (10 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/donor-tiers.ts lib/__tests__/donor-tiers.test.ts
git commit -m "feat(donations): add donor tier calculation library"
```

---

## Task 2: Transfer Note Generation & Parsing

**Files:**
- Create: `lib/transfer-note.ts`
- Test: `lib/__tests__/transfer-note.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/transfer-note.test.ts
import { describe, it, expect } from 'vitest'
import { generateTransferNote, parseTransferNote } from '../transfer-note'

describe('generateTransferNote', () => {
  it('produces DONATE-<shortId>-<random> format', () => {
    const note = generateTransferNote('clz1234567890')
    expect(note).toMatch(/^DONATE-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
  })
  it('uses first 4 uppercase chars of userId', () => {
    const note = generateTransferNote('abcd-rest')
    expect(note.startsWith('DONATE-ABCD-')).toBe(true)
  })
  it('falls back to GUEST for null userId', () => {
    const note = generateTransferNote(null)
    expect(note.startsWith('DONATE-GUES-')).toBe(true)
  })
})

describe('parseTransferNote', () => {
  it('extracts note from bank content with surrounding text', () => {
    const content = 'CK tu NGUYEN VAN A noi dung DONATE-U5K7-AB12 cam on'
    expect(parseTransferNote(content)).toBe('DONATE-U5K7-AB12')
  })
  it('returns null when no note present', () => {
    expect(parseTransferNote('chuyen tien an trua')).toBeNull()
  })
  it('is case-insensitive on input but returns uppercase', () => {
    expect(parseTransferNote('donate-u5k7-ab12')).toBe('DONATE-U5K7-AB12')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/__tests__/transfer-note.test.ts`
Expected: FAIL with "Cannot find module '../transfer-note'"

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/transfer-note.ts
const RANDOM_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function randomBlock(len = 4): string {
  let out = ''
  for (let i = 0; i < len; i++) {
    out += RANDOM_ALPHABET[Math.floor(Math.random() * RANDOM_ALPHABET.length)]
  }
  return out
}

export function generateTransferNote(userId: string | null): string {
  const raw = (userId ?? 'guest').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const shortId = (raw.slice(0, 4) || 'GUES').padEnd(4, 'X')
  return `DONATE-${shortId}-${randomBlock(4)}`
}

const NOTE_REGEX = /DONATE-[A-Z0-9]{4}-[A-Z0-9]{4}/i

export function parseTransferNote(bankContent: string): string | null {
  const match = bankContent.match(NOTE_REGEX)
  return match ? match[0].toUpperCase() : null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/__tests__/transfer-note.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/transfer-note.ts lib/__tests__/transfer-note.test.ts
git commit -m "feat(donations): add transfer note generation and parsing"
```

---

## Task 3: Prisma Schema Migration

**Files:**
- Modify: `prisma/schema.prisma:45-87` (User), `:418-468` (Donation), `:507-519` (enums)

- [ ] **Step 1: Add tier fields to User model**

In `prisma/schema.prisma`, inside `model User`, after the `founderTier` line (around line 61), add:

```prisma
  // Donor tier tracking
  totalDonatedVND     Int               @default(0)
  donorTier           String?           // BRONZE | SILVER | GOLD
  donorSince          DateTime?
  showOnDonorWall     Boolean           @default(true)
```

- [ ] **Step 2: Add fields to Donation model**

In `model Donation`, after the `transferNote` line (around line 437), add:

```prisma
  // VND-first amount (mirrors `amount` Decimal during migration window)
  amountVND    Int      @default(0)
  // Verification
  verifiedAt   DateTime?
  bankTxId     String?  @unique
  // Tier snapshot after this donation
  tierAtTime   String?
```

And add a unique index on `transferNote` plus a composite index. In the `@@index` block (around line 460-466), add:

```prisma
  @@index([transferNote])
  @@index([status, createdAt])
```

- [ ] **Step 3: Extend DonationStatus enum**

Replace the `DonationStatus` enum (lines 507-513) with:

```prisma
enum DonationStatus {
  PENDING
  COMPLETED
  VERIFIED
  EXPIRED
  FAILED
  REFUNDED
  CANCELLED
}
```

- [ ] **Step 4: Create the migration**

Run: `npx prisma migrate dev --name add_donor_tiers_and_verification`
Expected: Migration created under `prisma/migrations/`, Prisma Client regenerated, no errors.

- [ ] **Step 5: Verify client types**

Run: `npx tsc --noEmit`
Expected: No new type errors related to `donorTier`, `amountVND`, `verifiedAt`.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(donations): add donor tier and verification fields to schema"
```

---

## Task 4: Donation Verification Service

**Files:**
- Create: `lib/donation-service.ts`
- Test: `lib/__tests__/donation-service.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/donation-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { verifyDonation } from '../donation-service'

const txMock = {
  donation: { findUnique: vi.fn(), update: vi.fn() },
  user: { update: vi.fn(), findUnique: vi.fn() },
}

vi.mock('../prisma', () => ({
  prisma: {
    $transaction: vi.fn(async (cb: any) => cb(txMock)),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('verifyDonation', () => {
  it('marks donation VERIFIED and upgrades user tier', async () => {
    txMock.donation.findUnique.mockResolvedValue({
      id: 'd1', userId: 'u1', amountVND: 200_000, status: 'PENDING',
    })
    txMock.user.findUnique.mockResolvedValue({ id: 'u1', totalDonatedVND: 0, donorSince: null })
    txMock.donation.update.mockResolvedValue({})
    txMock.user.update.mockResolvedValue({})

    const result = await verifyDonation('d1', 'BANKTX99')

    expect(result.tier).toBe('SILVER')
    expect(txMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({ totalDonatedVND: 200_000, donorTier: 'SILVER' }),
      })
    )
  })

  it('is idempotent — already VERIFIED donation does nothing', async () => {
    txMock.donation.findUnique.mockResolvedValue({
      id: 'd1', userId: 'u1', amountVND: 200_000, status: 'VERIFIED',
    })
    const result = await verifyDonation('d1', 'BANKTX99')
    expect(result.alreadyVerified).toBe(true)
    expect(txMock.user.update).not.toHaveBeenCalled()
  })

  it('handles guest donation (no userId) without tier upgrade', async () => {
    txMock.donation.findUnique.mockResolvedValue({
      id: 'd2', userId: null, amountVND: 50_000, status: 'PENDING',
    })
    txMock.donation.update.mockResolvedValue({})
    const result = await verifyDonation('d2', 'BANKTX50')
    expect(result.tier).toBeNull()
    expect(txMock.user.update).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/__tests__/donation-service.test.ts`
Expected: FAIL with "Cannot find module '../donation-service'"

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/donation-service.ts
import { prisma } from './prisma'
import { calculateTier, type DonorTier } from './donor-tiers'

export interface VerifyResult {
  donationId: string
  tier: DonorTier | null
  alreadyVerified: boolean
}

export async function verifyDonation(
  donationId: string,
  bankTxId: string
): Promise<VerifyResult> {
  return prisma.$transaction(async (tx) => {
    const donation = await tx.donation.findUnique({ where: { id: donationId } })
    if (!donation) throw new Error(`Donation not found: ${donationId}`)

    if (donation.status === 'VERIFIED') {
      return { donationId, tier: (donation.tierAtTime as DonorTier) ?? null, alreadyVerified: true }
    }

    // Guest donation: verify but no tier
    if (!donation.userId) {
      await tx.donation.update({
        where: { id: donationId },
        data: { status: 'VERIFIED', verifiedAt: new Date(), bankTxId, completedAt: new Date() },
      })
      return { donationId, tier: null, alreadyVerified: false }
    }

    const user = await tx.user.findUnique({ where: { id: donation.userId } })
    if (!user) throw new Error(`User not found: ${donation.userId}`)

    const newTotal = user.totalDonatedVND + donation.amountVND
    const newTier = calculateTier(newTotal)

    await tx.donation.update({
      where: { id: donationId },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        completedAt: new Date(),
        bankTxId,
        tierAtTime: newTier,
      },
    })

    await tx.user.update({
      where: { id: user.id },
      data: {
        totalDonatedVND: newTotal,
        donorTier: newTier,
        donorSince: user.donorSince ?? new Date(),
      },
    })

    return { donationId, tier: newTier, alreadyVerified: false }
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/__tests__/donation-service.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/donation-service.ts lib/__tests__/donation-service.test.ts
git commit -m "feat(donations): add verifyDonation service with tier upgrade"
```

---

## Task 5: Bank Transfer Webhook Endpoint

**Files:**
- Create: `app/api/webhooks/bank-transfer/route.ts`

- [ ] **Step 1: Write the implementation**

```ts
// app/api/webhooks/bank-transfer/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseTransferNote } from '@/lib/transfer-note'
import { verifyDonation } from '@/lib/donation-service'

export const dynamic = 'force-dynamic'

// Sepay/Casso-style payload
interface BankWebhookBody {
  content: string      // transfer description
  transferAmount: number
  referenceCode: string // bank transaction id
}

export async function POST(req: NextRequest) {
  // 1. Validate webhook secret
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!secret || secret !== process.env.BANK_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: BankWebhookBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // 2. Extract transfer note
  const note = parseTransferNote(body.content || '')
  if (!note) {
    return NextResponse.json({ ok: true, matched: false, reason: 'no-note' })
  }

  // 3. Find pending donation
  const donation = await prisma.donation.findFirst({
    where: { transferNote: note, status: 'PENDING' },
  })
  if (!donation) {
    return NextResponse.json({ ok: true, matched: false, reason: 'not-found' })
  }

  // 4. Amount check (±5% tolerance for fees)
  const expected = donation.amountVND
  const paid = body.transferAmount
  const withinTolerance = paid >= expected * 0.95
  if (!withinTolerance) {
    return NextResponse.json({ ok: true, matched: false, reason: 'amount-mismatch', expected, paid })
  }

  // 5. Verify
  try {
    const result = await verifyDonation(donation.id, body.referenceCode)
    return NextResponse.json({ ok: true, matched: true, tier: result.tier })
  } catch (e) {
    console.error('verifyDonation failed:', e)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Add env var documentation**

Append to `.env.example`:

```bash
# Bank transfer webhook (Sepay/Casso) — shared secret for auto-verification
BANK_WEBHOOK_SECRET="change-me-to-a-long-random-string"
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors in `app/api/webhooks/bank-transfer/route.ts`.

- [ ] **Step 4: Commit**

```bash
git add app/api/webhooks/bank-transfer/route.ts .env.example
git commit -m "feat(donations): add bank-transfer webhook for auto-verification"
```

---

## Task 6: Refactor POST /api/donations to VND-first

**Files:**
- Modify: `app/api/donations/route.ts:12-34` (schema), `:79-201` (POST body)

- [ ] **Step 1: Replace the Zod schema**

Replace `createDonationSchema` (lines 12-34) with:

```ts
const createDonationSchema = z.object({
  amountVND: z.number()
    .int('Số tiền phải là số nguyên')
    .min(1000, 'Số tiền tối thiểu là 1.000₫')
    .max(500_000_000, 'Số tiền quá lớn'),
  paymentMethod: z.enum(['VIETQR', 'KOFI']),
  donorName: z.string().min(2).max(100).regex(nameRegex).optional(),
  message: z.string().max(500).optional(),
  isAnonymous: z.boolean().default(false),
  goalId: z.string().optional(),
})
```

- [ ] **Step 2: Update POST to generate transferNote and store VND**

In the POST handler, after `const data = validationResult.data` (around line 120), replace the donation-creation block with:

```ts
    const { getServerSession } = await import('next-auth')
    const { authOptions } = await import('@/lib/auth')
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id ?? null

    const { generateTransferNote } = await import('@/lib/transfer-note')
    const transferNote = generateTransferNote(userId)

    const donation = await prisma.donation.create({
      data: {
        amount: data.amountVND,           // legacy Decimal column mirrors VND
        amountVND: data.amountVND,
        currency: 'VND',
        paymentMethod: data.paymentMethod === 'KOFI' ? 'KOFI' : 'BANK_TRANSFER',
        userId,
        donorName: data.isAnonymous ? null : (data.donorName ?? session?.user?.name ?? null),
        donorEmail: session?.user?.email ?? null,
        message: data.message ?? null,
        isAnonymous: data.isAnonymous,
        goalId: data.goalId ?? null,
        transferNote,
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      donationId: donation.id,
      transferNote,
      amountVND: data.amountVND,
    })
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors in `app/api/donations/route.ts`.

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev` then in a second terminal:

```bash
curl -X POST http://localhost:3000/api/donations -H "Content-Type: application/json" -d "{\"amountVND\":200000,\"paymentMethod\":\"VIETQR\",\"isAnonymous\":true}"
```

Expected: JSON `{ donationId, transferNote: "DONATE-...", amountVND: 200000 }`

- [ ] **Step 5: Commit**

```bash
git add app/api/donations/route.ts
git commit -m "refactor(donations): VND-first POST with transfer note generation"
```

---

## Task 7: my-tier and donor-wall API endpoints

**Files:**
- Create: `app/api/donations/my-tier/route.ts`
- Create: `app/api/donations/donor-wall/route.ts`

- [ ] **Step 1: Write my-tier endpoint**

```ts
// app/api/donations/my-tier/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateTier, getNextTier, type DonorTier } from '@/lib/donor-tiers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id
  if (!userId) {
    return NextResponse.json({ tier: null, totalDonatedVND: 0, next: { tier: 'BRONZE', threshold: 50_000 } })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalDonatedVND: true, donorTier: true, donorSince: true },
  })

  const total = user?.totalDonatedVND ?? 0
  const tier = (user?.donorTier as DonorTier) ?? calculateTier(total)
  const next = getNextTier(tier)

  return NextResponse.json({
    tier,
    totalDonatedVND: total,
    donorSince: user?.donorSince ?? null,
    next: next ? { tier: next.tier, threshold: next.threshold, remaining: Math.max(0, next.threshold - total) } : null,
  })
}
```

- [ ] **Step 2: Write donor-wall endpoint**

```ts
// app/api/donations/donor-wall/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const limit = Math.min(parseInt(new URL(req.url).searchParams.get('limit') || '8'), 50)

  const donations = await prisma.donation.findMany({
    where: { status: 'VERIFIED' },
    orderBy: { verifiedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      amountVND: true,
      tierAtTime: true,
      isAnonymous: true,
      donorName: true,
      verifiedAt: true,
      user: { select: { name: true, donorTier: true } },
    },
  })

  const donors = donations.map((d) => ({
    id: d.id,
    name: d.isAnonymous ? null : (d.donorName ?? d.user?.name ?? null),
    tier: d.tierAtTime ?? d.user?.donorTier ?? null,
    verifiedAt: d.verifiedAt,
  }))

  return NextResponse.json({ donors })
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/donations/my-tier/route.ts app/api/donations/donor-wall/route.ts
git commit -m "feat(donations): add my-tier and donor-wall API endpoints"
```

---

## Task 8: Donation Zustand Store

**Files:**
- Create: `hooks/use-donation.ts`

- [ ] **Step 1: Write the store**

```ts
// hooks/use-donation.ts
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DonorTier } from '@/lib/donor-tiers'

export type PaymentMethod = 'VIETQR' | 'KOFI'
export type ModalContext = 'header' | 'post-download' | null

interface DonationSettings {
  kofiEnabled: boolean
  kofiUsername?: string
  vietqrEnabled: boolean
  vietqrBankId?: string
  vietqrAccountNo?: string
  vietqrAccountName?: string
}

interface DonationStore {
  // Modal
  isModalOpen: boolean
  modalContext: ModalContext
  openModal: (ctx: ModalContext) => void
  closeModal: () => void

  // Form
  amountVND: number | null
  message: string
  paymentMethod: PaymentMethod
  setAmount: (vnd: number) => void
  setMessage: (msg: string) => void
  setPaymentMethod: (m: PaymentMethod) => void

  // Settings cache
  settings: DonationSettings | null
  fetchSettings: () => Promise<void>

  // User tier
  myTier: DonorTier | null
  myTotalDonated: number
  fetchMyTier: () => Promise<void>

  // Nudge (7-day cooldown)
  lastNudgeDismissed: number | null
  shouldShowNudge: () => boolean
  dismissNudge: () => void
}

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000

export const useDonation = create<DonationStore>()(
  persist(
    (set, get) => ({
      isModalOpen: false,
      modalContext: null,
      openModal: (ctx) => set({ isModalOpen: true, modalContext: ctx }),
      closeModal: () => set({ isModalOpen: false, modalContext: null }),

      amountVND: null,
      message: '',
      paymentMethod: 'VIETQR',
      setAmount: (vnd) => set({ amountVND: vnd }),
      setMessage: (msg) => set({ message: msg }),
      setPaymentMethod: (m) => set({ paymentMethod: m }),

      settings: null,
      fetchSettings: async () => {
        try {
          const res = await fetch('/api/donations/settings')
          if (res.ok) {
            const data = await res.json()
            set({ settings: data.settings })
          }
        } catch { /* silent */ }
      },

      myTier: null,
      myTotalDonated: 0,
      fetchMyTier: async () => {
        try {
          const res = await fetch('/api/donations/my-tier')
          if (res.ok) {
            const data = await res.json()
            set({ myTier: data.tier, myTotalDonated: data.totalDonatedVND })
          }
        } catch { /* silent */ }
      },

      lastNudgeDismissed: null,
      shouldShowNudge: () => {
        const last = get().lastNudgeDismissed
        if (!last) return true
        return Date.now() - last > SEVEN_DAYS
      },
      dismissNudge: () => set({ lastNudgeDismissed: Date.now() }),
    }),
    {
      name: 'donation-store',
      partialize: (s) => ({ lastNudgeDismissed: s.lastNudgeDismissed }),
    }
  )
)
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors in `hooks/use-donation.ts`.

- [ ] **Step 3: Commit**

```bash
git add hooks/use-donation.ts
git commit -m "feat(donations): add unified donation Zustand store"
```

---

## Task 9: DonorTierBadge Component

**Files:**
- Create: `components/donation/donor-tier-badge.tsx`
- Test: `components/donation/__tests__/donor-tier-badge.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/donation/__tests__/donor-tier-badge.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DonorTierBadge } from '../donor-tier-badge'

describe('DonorTierBadge', () => {
  it('renders the tier label', () => {
    render(<DonorTierBadge tier="GOLD" />)
    expect(screen.getByText('Gold')).toBeInTheDocument()
  })
  it('renders nothing for null tier', () => {
    const { container } = render(<DonorTierBadge tier={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/donation/__tests__/donor-tier-badge.test.tsx`
Expected: FAIL with "Cannot find module '../donor-tier-badge'"

- [ ] **Step 3: Write minimal implementation**

```tsx
// components/donation/donor-tier-badge.tsx
import { TIER_LABELS, type DonorTier } from '@/lib/donor-tiers'
import { cn } from '@/lib/utils'

interface Props {
  tier: DonorTier | null
  size?: 'xs' | 'sm' | 'md'
  className?: string
}

const TIER_CLASSES: Record<DonorTier, string> = {
  BRONZE: 'border-orange-300 text-orange-700 bg-orange-50',
  SILVER: 'border-neutral-300 text-neutral-700 bg-neutral-50',
  GOLD: 'border-amber-300 text-amber-700 bg-amber-50',
}

const SIZE_CLASSES = {
  xs: 'text-[10px] px-1.5 py-0.5',
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
}

export function DonorTierBadge({ tier, size = 'sm', className }: Props) {
  if (!tier) return null
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        TIER_CLASSES[tier],
        SIZE_CLASSES[size],
        className
      )}
    >
      {TIER_LABELS[tier]}
    </span>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/donation/__tests__/donor-tier-badge.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add components/donation/donor-tier-badge.tsx components/donation/__tests__/donor-tier-badge.test.tsx
git commit -m "feat(donations): add DonorTierBadge component"
```

---

## Task 10: GoalProgress Component

**Files:**
- Create: `components/donation/goal-progress.tsx`

- [ ] **Step 1: Write the component**

```tsx
// components/donation/goal-progress.tsx
'use client'

import { useEffect, useState } from 'react'

interface Goal {
  title: string
  currentAmount: number
  targetAmount: number
  donorCount?: number
}

function formatVND(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + '₫'
}

export function GoalProgress({ pollMs = 60_000 }: { pollMs?: number }) {
  const [goal, setGoal] = useState<Goal | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await fetch('/api/donations/goals?public=true')
        if (res.ok && active) {
          const data = await res.json()
          if (data.goals?.length) setGoal(data.goals[0])
        }
      } catch { /* silent */ }
    }
    load()
    const id = setInterval(load, pollMs)
    return () => { active = false; clearInterval(id) }
  }, [pollMs])

  if (!goal) return null
  const pct = goal.targetAmount > 0
    ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
    : 0

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between text-sm mb-2">
        <span className="font-medium">{goal.title}</span>
        <span className="text-neutral-500">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
        <div className="h-full bg-black rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-baseline justify-between mt-2 text-sm">
        <span><span className="font-semibold">{formatVND(goal.currentAmount)}</span>
          <span className="text-neutral-500"> / {formatVND(goal.targetAmount)}</span></span>
        {goal.donorCount != null && (
          <span className="text-neutral-500">{goal.donorCount} người ủng hộ</span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/donation/goal-progress.tsx
git commit -m "feat(donations): add GoalProgress component"
```

---

## Task 11: TierLadder Component

**Files:**
- Create: `components/donation/tier-ladder.tsx`

- [ ] **Step 1: Write the component**

```tsx
// components/donation/tier-ladder.tsx
'use client'

interface TierDef {
  key: 'BRONZE' | 'SILVER' | 'GOLD'
  label: string
  amount: string
  amountVND: number
  perks: string[]
  popular?: boolean
}

const TIERS: TierDef[] = [
  {
    key: 'BRONZE', label: 'Bronze', amount: '50.000₫', amountVND: 50_000,
    perks: ['Bronze badge trên profile', 'Tên trên Donor Wall', 'Email cảm ơn cá nhân'],
  },
  {
    key: 'SILVER', label: 'Silver', amount: '200.000₫', amountVND: 200_000, popular: true,
    perks: ['Tất cả quyền lợi Bronze', 'Silver badge nổi bật', 'Early access skin mới (7 ngày)', 'Discord supporter role'],
  },
  {
    key: 'GOLD', label: 'Gold', amount: '500.000₫', amountVND: 500_000,
    perks: ['Tất cả quyền lợi Silver', 'Gold badge', 'Priority support 24h', 'Vote feature ưu tiên', 'Tên trong credits của app'],
  },
]

export function TierLadder({ onSelect }: { onSelect?: (vnd: number) => void }) {
  return (
    <div className="grid md:grid-cols-3 gap-px bg-neutral-200 border border-neutral-200 rounded-lg overflow-hidden">
      {TIERS.map((t) => (
        <div key={t.key} className="bg-white p-8 relative">
          {t.popular && (
            <div className="absolute top-4 right-4 text-[10px] font-semibold tracking-wider uppercase text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
              Phổ biến
            </div>
          )}
          <div className="text-xs font-semibold tracking-wider uppercase text-neutral-500 mb-4">{t.label}</div>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-3xl font-bold">{t.amount}</span>
            <span className="text-neutral-500 text-sm">trở lên</span>
          </div>
          <ul className="space-y-3 text-sm text-neutral-700">
            {t.perks.map((p) => (
              <li key={p} className="flex gap-2"><span className="text-neutral-400 mt-0.5">—</span><span>{p}</span></li>
            ))}
          </ul>
          <button
            onClick={() => onSelect?.(t.amountVND)}
            className={t.popular
              ? 'mt-8 w-full h-10 rounded-md bg-black text-white text-sm font-medium hover:bg-neutral-800'
              : 'mt-8 w-full h-10 rounded-md border border-neutral-200 text-sm font-medium hover:border-black'}
          >
            Chọn {t.label}
          </button>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/donation/tier-ladder.tsx
git commit -m "feat(donations): add TierLadder component"
```

---

## Task 12: DonateForm Component (unified)

**Files:**
- Create: `components/donation/donate-form.tsx`

- [ ] **Step 1: Write the component**

```tsx
// components/donation/donate-form.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useDonation } from '@/hooks/use-donation'
import { calculateTier, TIER_LABELS } from '@/lib/donor-tiers'

const PRESETS = [20_000, 50_000, 100_000, 200_000, 500_000, 1_000_000]

function fmt(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + '₫'
}

interface Props {
  initialAmount?: number
  onSubmitted?: (r: { donationId: string; transferNote: string }) => void
}

export function DonateForm({ initialAmount, onSubmitted }: Props) {
  const { settings, fetchSettings, paymentMethod, setPaymentMethod } = useDonation()
  const [amount, setAmount] = useState<number | null>(initialAmount ?? 50_000)
  const [custom, setCustom] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ transferNote: string } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => { fetchSettings() }, [fetchSettings])
  useEffect(() => { if (initialAmount) setAmount(initialAmount) }, [initialAmount])

  const finalAmount = useMemo(() => {
    if (custom) return Math.max(0, parseInt(custom.replace(/\D/g, '')) || 0)
    return amount ?? 0
  }, [amount, custom])

  const tierHint = calculateTier(finalAmount)

  const qrUrl = useMemo(() => {
    if (paymentMethod !== 'VIETQR' || !settings?.vietqrBankId || !settings.vietqrAccountNo) return ''
    const params = new URLSearchParams()
    if (finalAmount > 0) params.append('amount', String(finalAmount))
    params.append('addInfo', result?.transferNote ?? 'Ung ho du an')
    params.append('accountName', settings.vietqrAccountName ?? '')
    return `https://img.vietqr.io/image/${settings.vietqrBankId}-${settings.vietqrAccountNo}-compact2.jpg?${params.toString()}`
  }, [paymentMethod, settings, finalAmount, result])

  const submit = async () => {
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountVND: finalAmount, paymentMethod, message, isAnonymous: false }),
      })
      if (!res.ok) { setError('Không thể tạo lượt ủng hộ. Thử lại sau.'); return }
      const data = await res.json()
      setResult({ transferNote: data.transferNote })
      onSubmitted?.(data)
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12">
      <div>
        <div className="flex border-b border-neutral-200 mb-8">
          <button onClick={() => setPaymentMethod('VIETQR')}
            className={paymentMethod === 'VIETQR' ? 'pb-3 px-1 mr-6 font-medium border-b-2 border-black -mb-px' : 'pb-3 px-1 mr-6 font-medium text-neutral-500'}>
            VietQR
          </button>
          {settings?.kofiEnabled && (
            <button onClick={() => setPaymentMethod('KOFI')}
              className={paymentMethod === 'KOFI' ? 'pb-3 px-1 font-medium border-b-2 border-black -mb-px' : 'pb-3 px-1 font-medium text-neutral-500'}>
              Ko-fi
            </button>
          )}
        </div>

        {paymentMethod === 'VIETQR' ? (
          <>
            <label className="text-sm font-medium block mb-3">Số tiền</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button key={p} onClick={() => { setAmount(p); setCustom('') }}
                  className={amount === p && !custom
                    ? 'h-10 rounded-md border-2 border-black text-sm font-semibold'
                    : 'h-10 rounded-md border border-neutral-200 text-sm hover:border-black'}>
                  {fmt(p)}
                </button>
              ))}
            </div>
            <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Số tiền tùy chọn"
              className="mt-2 w-full h-10 px-3 rounded-md border border-neutral-200 focus:border-black outline-none text-sm" />
            <label className="text-sm font-medium block mt-6 mb-3">Lời nhắn (tùy chọn)</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
              className="w-full px-3 py-2 rounded-md border border-neutral-200 focus:border-black outline-none text-sm resize-none" />
            {tierHint && (
              <div className="mt-4 text-xs text-neutral-600 border-l-2 border-neutral-900 pl-3">
                Mức {fmt(finalAmount)} tương ứng tier <strong>{TIER_LABELS[tierHint]}</strong>.
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-neutral-600">
            <p>Ủng hộ qua Ko-fi (dành cho người dùng quốc tế):</p>
            <a href={`https://ko-fi.com/${settings?.kofiUsername ?? ''}`} target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-flex items-center h-10 px-5 rounded-md bg-black text-white font-medium">
              Mở Ko-fi
            </a>
          </div>
        )}
      </div>

      {paymentMethod === 'VIETQR' && (
        <div>
          <div className="rounded-lg border border-neutral-200 p-8 bg-neutral-50">
            {qrUrl ? (
              <img src={qrUrl} alt="VietQR" className="w-44 h-44 mx-auto bg-white rounded-md border border-neutral-200 p-2" />
            ) : (
              <div className="w-44 h-44 mx-auto bg-white rounded-md border border-neutral-200 grid place-items-center text-xs text-neutral-400">
                QR sẽ hiện sau khi xác nhận
              </div>
            )}
            {result && (
              <div className="mt-4 text-center text-sm">
                <div className="text-neutral-500 text-xs uppercase tracking-wider">Nội dung chuyển khoản</div>
                <div className="font-mono font-semibold mt-1 bg-white border border-neutral-200 rounded px-2 py-1 inline-block">
                  {result.transferNote}
                </div>
              </div>
            )}
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button onClick={submit} disabled={loading || finalAmount <= 0}
            className="mt-4 w-full h-11 rounded-md bg-black text-white font-medium hover:bg-neutral-800 disabled:opacity-50">
            {loading ? 'Đang xử lý...' : result ? 'Tôi đã chuyển khoản' : 'Tạo mã chuyển khoản'}
          </button>
          <p className="mt-3 text-center text-xs text-neutral-500">Hệ thống xác nhận tự động trong 5 phút.</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/donation/donate-form.tsx
git commit -m "feat(donations): add unified DonateForm component"
```

---

## Task 13: DonorWall and DonateHero Components

**Files:**
- Create: `components/donation/donor-wall.tsx`
- Create: `components/donation/donate-hero.tsx`

- [ ] **Step 1: Write DonorWall**

```tsx
// components/donation/donor-wall.tsx
'use client'

import { useEffect, useState } from 'react'

interface Donor {
  id: string
  name: string | null
  tier: string | null
  verifiedAt: string | null
}

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'hôm nay'
  return `${days} ngày trước`
}

export function DonorWall({ limit = 8 }: { limit?: number }) {
  const [donors, setDonors] = useState<Donor[]>([])

  useEffect(() => {
    fetch(`/api/donations/donor-wall?limit=${limit}`)
      .then((r) => r.ok ? r.json() : { donors: [] })
      .then((d) => setDonors(d.donors ?? []))
      .catch(() => {})
  }, [limit])

  if (donors.length === 0) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 text-sm">
      {donors.map((d) => (
        <div key={d.id} className="py-3 border-b border-neutral-200">
          <div className={d.name ? 'font-medium' : 'font-medium text-neutral-500 italic'}>
            {d.name ?? 'Anonymous'}
          </div>
          <div className="text-xs text-neutral-500">
            {d.tier ?? 'Donor'} · {timeAgo(d.verifiedAt)}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Write DonateHero**

```tsx
// components/donation/donate-hero.tsx
import { GoalProgress } from './goal-progress'

export function DonateHero() {
  return (
    <section className="border-b border-neutral-200">
      <div className="max-w-5xl mx-auto px-6 py-24">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold tracking-wider uppercase text-neutral-500 mb-6">
            Hỗ trợ dự án
          </div>
          <h1 className="text-5xl font-bold tracking-tight leading-[1.1]">
            Giúp WebModSkin<br />tiếp tục miễn phí.
          </h1>
          <p className="mt-6 text-lg text-neutral-600 leading-relaxed">
            Toàn bộ skins, công cụ và bản cập nhật đều miễn phí. Sự ủng hộ của bạn giúp chúng tôi duy trì server, băng thông và phát triển tính năng mới.
          </p>
        </div>
        <div className="mt-12 max-w-2xl">
          <GoalProgress />
        </div>
        <div className="mt-12 flex items-center gap-3">
          <a href="#form" className="px-5 h-11 inline-flex items-center rounded-md bg-black text-white font-medium hover:bg-neutral-800">Ủng hộ ngay</a>
          <a href="#tiers" className="px-5 h-11 inline-flex items-center rounded-md border border-neutral-200 font-medium hover:bg-neutral-50">Xem các mức</a>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add components/donation/donor-wall.tsx components/donation/donate-hero.tsx
git commit -m "feat(donations): add DonorWall and DonateHero components"
```

---

## Task 14: Rebuild /donate Page

**Files:**
- Modify: `app/donate/page.tsx` (full replace)

- [ ] **Step 1: Replace the page**

```tsx
// app/donate/page.tsx
import { DonateHero } from '@/components/donation/donate-hero'
import { DonateForm } from '@/components/donation/donate-form'
import { TierLadder } from '@/components/donation/tier-ladder'
import { DonorWall } from '@/components/donation/donor-wall'
import { DonatePageClient } from './donate-client'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Ủng hộ — WebModSkin',
  description: 'Giúp WebModSkin tiếp tục miễn phí cho mọi người.',
}

export default function DonatePage() {
  return (
    <>
      <DonateHero />
      <DonatePageClient />
      <section className="border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="text-xs font-semibold tracking-wider uppercase text-neutral-500 mb-3">Donor wall</div>
              <h2 className="text-3xl font-bold tracking-tight">Người ủng hộ gần đây</h2>
            </div>
            <a href="/donate/donors" className="text-sm font-medium underline underline-offset-4 hover:text-neutral-600">Xem tất cả</a>
          </div>
          <DonorWall limit={8} />
        </div>
      </section>
    </>
  )
}
```

- [ ] **Step 2: Create the client section (form + tiers interaction)**

```tsx
// app/donate/donate-client.tsx
'use client'

import { useState } from 'react'
import { DonateForm } from '@/components/donation/donate-form'
import { TierLadder } from '@/components/donation/tier-ladder'

export function DonatePageClient() {
  const [selectedAmount, setSelectedAmount] = useState<number | undefined>(undefined)

  return (
    <>
      <section id="form" className="border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Cách ủng hộ</h2>
            <p className="mt-3 text-neutral-600">VietQR là cách nhanh nhất tại Việt Nam, không mất phí giao dịch.</p>
          </div>
          <DonateForm initialAmount={selectedAmount} />
        </div>
      </section>

      <section id="tiers" className="border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="max-w-2xl mb-14">
            <div className="text-xs font-semibold tracking-wider uppercase text-neutral-500 mb-3">Các mức ủng hộ</div>
            <h2 className="text-3xl font-bold tracking-tight">Lời cảm ơn dành cho bạn</h2>
            <p className="mt-3 text-neutral-600">Tier được tính theo tổng số tiền tích lũy. Bạn có thể donate nhiều lần để lên tier cao hơn.</p>
          </div>
          <TierLadder onSelect={(vnd) => {
            setSelectedAmount(vnd)
            document.getElementById('form')?.scrollIntoView({ behavior: 'smooth' })
          }} />
        </div>
      </section>
    </>
  )
}
```

- [ ] **Step 3: Remove unused import in page**

Edit `app/donate/page.tsx` — remove the now-unused top-level imports `DonateForm` and `TierLadder` (they live in the client component). Final imports should be only: `DonateHero`, `DonorWall`, `DonatePageClient`, `Metadata`.

- [ ] **Step 4: Type-check + run dev**

Run: `npx tsc --noEmit`
Expected: No errors.

Run: `npm run dev`, open `http://localhost:3000/donate`
Expected: Page renders hero, form (VietQR tab), tier ladder, donor wall.

- [ ] **Step 5: Commit**

```bash
git add app/donate/page.tsx app/donate/donate-client.tsx
git commit -m "feat(donations): rebuild /donate landing page"
```

---

## Task 15: Admin Manual Verification (fallback)

**Files:**
- Modify: `app/api/donations/[id]/route.ts` (add PATCH for verify)

- [ ] **Step 1: Read current route to find insertion point**

Run: read `app/api/donations/[id]/route.ts` fully before editing so the PATCH handler matches existing auth/style.

- [ ] **Step 2: Add PATCH handler**

Append a `PATCH` export to `app/api/donations/[id]/route.ts`:

```ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyDonation } from '@/lib/donation-service'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const bankTxId = body.bankTxId || `MANUAL-${Date.now()}`

  try {
    const result = await verifyDonation(params.id, bankTxId)
    return NextResponse.json({ ok: true, tier: result.tier, alreadyVerified: result.alreadyVerified })
  } catch (e) {
    console.error('Manual verify failed:', e)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
```

(If `NextRequest`/`NextResponse` are already imported at the top of the file, do not duplicate the import.)

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/donations/[id]/route.ts
git commit -m "feat(donations): add admin manual verification endpoint"
```

---

## Task 16: Delete Legacy Donation Files

**Files (delete):**
- `components/shared/donation-form.tsx`
- `components/shared/donation-form-new.tsx`
- `components/shared/donation-form-clean.tsx`
- `components/shared/donation-overlay.tsx`
- `components/shared/donation-provider.tsx`
- `components/shared/donation-trigger.tsx`
- `components/shared/donation-messages.tsx`
- `hooks/use-donation-overlay.ts`

- [ ] **Step 1: Find all references to legacy files**

Run: search for imports of each legacy module.

```bash
findstr /s /i /m "donation-form donation-overlay donation-provider donation-trigger donation-messages use-donation-overlay" app\*.tsx app\*.ts components\*.tsx
```

Expected: A list of files importing legacy modules (likely `app/layout.tsx` or a providers file referencing `DonationProvider`).

- [ ] **Step 2: Replace DonationProvider usage**

Wherever `DonationProvider` is imported/rendered (likely `app/layout.tsx`), remove the import and the `<DonationProvider />` element. The new modal-trigger wiring is handled in Sub-project 2; for now `/donate` page is the entry point.

- [ ] **Step 3: Delete the files**

```bash
del components\shared\donation-form.tsx components\shared\donation-form-new.tsx components\shared\donation-form-clean.tsx components\shared\donation-overlay.tsx components\shared\donation-provider.tsx components\shared\donation-trigger.tsx components\shared\donation-messages.tsx hooks\use-donation-overlay.ts
```

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit`
Expected: No "Cannot find module" errors. If any remain, fix the offending import.

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(donations): remove legacy donation components"
```

---

## Task 17: Full Test Suite + Build Verification

- [ ] **Step 1: Run all donation tests**

Run: `npx vitest run lib/__tests__/donor-tiers.test.ts lib/__tests__/transfer-note.test.ts lib/__tests__/donation-service.test.ts components/donation/__tests__/donor-tier-badge.test.tsx`
Expected: All pass.

- [ ] **Step 2: Full type-check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: Build succeeds, `/donate` route listed.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "test(donations): verify donation core build and tests pass"
```

---

## Self-Review Notes

**Spec coverage:**
- Tier system → Tasks 1, 9, 11 ✓
- VND-first donations → Tasks 3, 6 ✓
- TransferNote → Task 2 ✓
- Verification service → Task 4 ✓
- Bank webhook → Task 5 ✓
- my-tier / donor-wall APIs → Task 7 ✓
- Zustand store → Task 8 ✓
- GoalProgress / DonorWall / Hero / Form → Tasks 10, 12, 13 ✓
- /donate page → Task 14 ✓
- Admin manual verify → Task 15 ✓
- Legacy cleanup → Task 16 ✓
- Ko-fi tab → Task 12 ✓

**Deferred (per spec sub-project boundaries):**
- Homepage hero + post-download modal + footer progress → Sub-project 2
- Remove /pricing, /cart, /checkout, orders, license repurpose → Sub-project 3
- Leaderboard page `/donate/donors` → linked but full page deferred to SP2
- Sepay/Casso live registration → ops task, webhook endpoint is ready

**Type consistency check:**
- `DonorTier` type used consistently across donor-tiers.ts, donation-service.ts, donor-tier-badge.tsx, use-donation.ts ✓
- `verifyDonation(id, bankTxId)` signature consistent in service, webhook, admin PATCH ✓
- `amountVND` (Int) consistent in schema, POST, service, donor-wall ✓
- `transferNote` field consistent across schema, POST, webhook, form ✓

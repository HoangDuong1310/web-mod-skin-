// app/api/webhooks/bank-transfer/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseTransferNote } from '@/lib/transfer-note'
import { verifyDonation } from '@/lib/donation-service'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Constant-time secret comparison. Hash both sides to a fixed length first so
// timingSafeEqual never throws on length mismatch and no length is leaked.
function safeEqual(a: string, b: string): boolean {
  const ah = crypto.createHash('sha256').update(a).digest()
  const bh = crypto.createHash('sha256').update(b).digest()
  return crypto.timingSafeEqual(ah, bh)
}

// Sepay/Casso-style payload
interface BankWebhookBody {
  content: string      // transfer description
  transferAmount: number
  referenceCode: string // bank transaction id
}

export async function POST(req: NextRequest) {
  // 1. Validate webhook secret (constant-time; fail closed if unconfigured)
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  const expectedSecret = process.env.BANK_WEBHOOK_SECRET
  if (!expectedSecret || !secret || !safeEqual(secret, expectedSecret)) {
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

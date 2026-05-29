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

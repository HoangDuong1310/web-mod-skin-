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

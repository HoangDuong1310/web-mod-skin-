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

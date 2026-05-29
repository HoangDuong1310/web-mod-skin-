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

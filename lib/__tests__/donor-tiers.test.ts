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

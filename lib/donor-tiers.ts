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

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

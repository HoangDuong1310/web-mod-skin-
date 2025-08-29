'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  interactive?: boolean
  onChange?: (rating: number) => void
  className?: string
}

export function StarRating({
  rating,
  size = 'md',
  showValue = false,
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  const handleStarClick = (starRating: number) => {
    if (interactive && onChange) {
      onChange(starRating)
    }
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= rating
        const halfFilled = star - 0.5 === rating

        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => handleStarClick(star)}
            className={cn(
              'relative transition-colors',
              interactive && 'hover:scale-110 cursor-pointer',
              !interactive && 'cursor-default'
            )}
          >
            <Star
              className={cn(
                sizes[size],
                filled
                  ? 'fill-yellow-400 text-yellow-400'
                  : halfFilled
                  ? 'fill-yellow-200 text-yellow-400'
                  : 'fill-muted text-muted-foreground'
              )}
            />
          </button>
        )
      })}
      {showValue && (
        <span className="ml-1 text-sm text-muted-foreground">
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  )
}
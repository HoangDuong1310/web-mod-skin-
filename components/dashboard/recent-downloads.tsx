import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/ui/star-rating'
import { formatDate } from '@/lib/utils'
import { User } from 'lucide-react'

interface Review {
  id: string
  rating: number
  title: string
  content: string
  createdAt: Date
  isVerified: boolean
  guestName?: string
  product: {
    title: string
    slug: string
  }
  user?: {
    name: string
  }
}

interface RecentDownloadsProps {
  reviews: Review[]
}

export function RecentDownloads({ reviews }: RecentDownloadsProps) {
  if (!reviews.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No recent reviews
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="flex items-start space-x-4">
          <Avatar className="h-9 w-9">
            <AvatarFallback>
              {review.user?.name?.[0] || review.guestName?.[0] || <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">
                {review.user?.name || review.guestName || 'Anonymous User'}
              </p>
              {review.isVerified && (
                <Badge variant="secondary" className="text-xs">
                  Verified
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-sm text-muted-foreground">
                for {review.product.title}
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2">
              {review.title}
            </p>
            
            <p className="text-xs text-muted-foreground">
              {formatDate(review.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

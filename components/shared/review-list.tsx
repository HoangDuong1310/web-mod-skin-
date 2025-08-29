'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StarRating } from '@/components/ui/star-rating'
import { Separator } from '@/components/ui/separator'
import { formatDate } from '@/lib/utils'
import { ChevronDown, Filter, Star, User, Verified } from 'lucide-react'

interface Review {
  id: string
  rating: number
  title: string
  content: string
  createdAt: string
  isVerified: boolean
  user: {
    name: string
    image?: string
  } | null
  guestName?: string
}

interface ReviewStats {
  averageRating: number
  totalReviews: number
  distribution: Record<number, number>
}

interface ReviewListProps {
  productId: string
  refreshTrigger?: number
}

export function ReviewList({ productId, refreshTrigger }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')
  const [filterRating, setFilterRating] = useState<string>('all')
  const [showStats, setShowStats] = useState(false)

  const fetchReviews = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      const params = new URLSearchParams({
        productId,
        page: pageNum.toString(),
        limit: '10',
        sort: sortBy,
      })

      if (filterRating && filterRating !== 'all') {
        params.append('rating', filterRating)
      }

      const response = await fetch(`/api/reviews?${params}`)
      if (!response.ok) throw new Error('Failed to fetch reviews')

      const data = await response.json()

      if (append) {
        setReviews(prev => [...prev, ...data.reviews])
      } else {
        setReviews(data.reviews)
        setStats(data.stats)
      }

      setHasMore(data.pagination.page < data.pagination.pages)
      setPage(pageNum)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchReviews(1, false)
  }, [productId, sortBy, filterRating, refreshTrigger])

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchReviews(page + 1, true)
    }
  }

  const getRatingDistribution = () => {
    if (!stats) return []
    
    return [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: stats.distribution[rating] || 0,
      percentage: stats.totalReviews > 0 
        ? ((stats.distribution[rating] || 0) / stats.totalReviews) * 100 
        : 0
    }))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-4" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Card */}
      {stats && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Customer Reviews</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStats(!showStats)}
                className="text-sm"
              >
                {showStats ? 'Hide' : 'Show'} Details
                <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showStats ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{Number(stats.averageRating).toFixed(1)}</div>
                <StarRating rating={stats.averageRating} size="sm" />
                <div className="text-sm text-muted-foreground mt-1">
                  {stats.totalReviews} reviews
                </div>
              </div>
              
              {showStats && (
                <div className="flex-1 space-y-2">
                  {getRatingDistribution().map(({ rating, count, percentage }) => (
                    <div key={rating} className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1 w-12">
                        <span>{rating}</span>
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="highest">Highest Rating</SelectItem>
            <SelectItem value="lowest">Lowest Rating</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterRating} onValueChange={setFilterRating}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="text-muted-foreground">
                {filterRating && filterRating !== 'all' 
                  ? `No reviews found with ${filterRating} stars`
                  : 'No reviews yet. Be the first to review!'
                }
              </div>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage 
                      src={review.user?.image} 
                      alt={review.user?.name || review.guestName || 'Anonymous'} 
                    />
                    <AvatarFallback>
                      {review.user?.name?.[0] || review.guestName?.[0] || <User className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {review.user?.name || review.guestName || 'Anonymous User'}
                        </span>
                        {review.isVerified && (
                          <Badge variant="secondary" className="text-xs">
                            <Verified className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="text-sm text-muted-foreground">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    {review.title && (
                      <h4 className="font-medium">{review.title}</h4>
                    )}
                    
                    <p className="text-muted-foreground leading-relaxed">
                      {review.content}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Load More Button */}
        {hasMore && reviews.length > 0 && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={loadingMore}
              className="min-w-32"
            >
              {loadingMore ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                  Loading...
                </div>
              ) : (
                'Load More Reviews'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
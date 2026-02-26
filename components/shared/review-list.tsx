'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { StarRating } from '@/components/ui/star-rating'
import { Separator } from '@/components/ui/separator'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { 
  ChevronDown, 
  Filter, 
  Star, 
  User, 
  Verified, 
  MessageCircle, 
  Send, 
  Loader2, 
  CornerDownRight,
  Shield,
  Trash2,
  X
} from 'lucide-react'

interface ReviewReply {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    image?: string
    role: string
  }
}

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
  replies?: ReviewReply[]
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
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')
  const [filterRating, setFilterRating] = useState<string>('all')
  const [showStats, setShowStats] = useState(false)
  
  // Reply states
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())

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

  const toggleReplies = (reviewId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev)
      if (next.has(reviewId)) {
        next.delete(reviewId)
      } else {
        next.add(reviewId)
      }
      return next
    })
  }

  const handleReply = (reviewId: string) => {
    if (!session?.user) {
      toast.error('Bạn cần đăng nhập để trả lời')
      return
    }
    setReplyingTo(replyingTo === reviewId ? null : reviewId)
    setReplyContent('')
    // Auto-expand replies when replying
    setExpandedReplies(prev => new Set(prev).add(reviewId))
  }

  const submitReply = async (reviewId: string) => {
    if (!replyContent.trim()) {
      toast.error('Vui lòng nhập nội dung trả lời')
      return
    }

    try {
      setSubmittingReply(true)
      const response = await fetch('/api/reviews/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          content: replyContent.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit reply')
      }

      const data = await response.json()

      // Update review with new reply locally
      setReviews(prev =>
        prev.map(review => {
          if (review.id === reviewId) {
            return {
              ...review,
              replies: [...(review.replies || []), data.reply],
            }
          }
          return review
        })
      )

      setReplyContent('')
      setReplyingTo(null)
      toast.success('Trả lời thành công!')
    } catch (error) {
      console.error('Error submitting reply:', error)
      toast.error(error instanceof Error ? error.message : 'Không thể gửi trả lời')
    } finally {
      setSubmittingReply(false)
    }
  }

  const deleteReply = async (reviewId: string, replyId: string) => {
    try {
      const response = await fetch(`/api/reviews/replies?id=${replyId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete reply')

      // Update local state
      setReviews(prev =>
        prev.map(review => {
          if (review.id === reviewId) {
            return {
              ...review,
              replies: (review.replies || []).filter(r => r.id !== replyId),
            }
          }
          return review
        })
      )

      toast.success('Đã xóa trả lời')
    } catch (error) {
      console.error('Error deleting reply:', error)
      toast.error('Không thể xóa trả lời')
    }
  }

  const getRoleBadge = (role: string) => {
    if (role === 'ADMIN') {
      return (
        <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-red-600 hover:bg-red-700">
          <Shield className="w-2.5 h-2.5 mr-0.5" />
          Admin
        </Badge>
      )
    }
    if (role === 'STAFF') {
      return (
        <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-blue-600 hover:bg-blue-700">
          <Shield className="w-2.5 h-2.5 mr-0.5" />
          Staff
        </Badge>
      )
    }
    return null
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
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Card */}
      {stats && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg">Customer Reviews</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStats(!showStats)}
                className="text-xs sm:text-sm"
              >
                {showStats ? 'Hide' : 'Show'} Details
                <ChevronDown className={`ml-1 h-3 w-3 sm:h-4 sm:w-4 transition-transform ${showStats ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
              <div className="text-center w-full sm:w-auto">
                <div className="text-2xl sm:text-3xl font-bold">{Number(stats.averageRating).toFixed(1)}</div>
                <StarRating rating={stats.averageRating} size="sm" />
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {stats.totalReviews} reviews
                </div>
              </div>
              
              {showStats && (
                <div className="flex-1 space-y-2 w-full">
                  {getRatingDistribution().map(({ rating, count, percentage }) => (
                    <div key={rating} className="flex items-center gap-2 text-xs sm:text-sm">
                      <div className="flex items-center gap-1 w-10 sm:w-12 shrink-0">
                        <span>{rating}</span>
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-6 sm:w-8 text-right shrink-0">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-48 h-9 text-sm">
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
          <SelectTrigger className="w-full sm:w-48 h-9 text-sm">
            <Filter className="w-3.5 h-3.5 mr-2" />
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
      <div className="space-y-3 sm:space-y-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="text-muted-foreground text-sm sm:text-base">
                {filterRating && filterRating !== 'all' 
                  ? `No reviews found with ${filterRating} stars`
                  : 'No reviews yet. Be the first to review!'
                }
              </div>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="overflow-hidden">
              <CardContent className="p-3 sm:p-6">
                {/* Review Content */}
                <div className="flex items-start gap-2.5 sm:gap-4">
                  <Avatar className="w-8 h-8 sm:w-10 sm:h-10 shrink-0">
                    <AvatarImage 
                      src={review.user?.image} 
                      alt={review.user?.name || review.guestName || 'Anonymous'} 
                    />
                    <AvatarFallback className="text-xs sm:text-sm">
                      {review.user?.name?.[0] || review.guestName?.[0] || <User className="w-3 h-3 sm:w-4 sm:h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                    {/* Mobile: stack vertically, Desktop: side by side */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="font-medium text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">
                          {review.user?.name || review.guestName || 'Anonymous User'}
                        </span>
                        {review.isVerified && (
                          <Badge variant="secondary" className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0">
                            <Verified className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    {review.title && (
                      <h4 className="font-medium text-sm sm:text-base">{review.title}</h4>
                    )}
                    
                    <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm break-words">
                      {review.content}
                    </p>

                    {/* Reply button and reply count */}
                    <div className="flex items-center gap-3 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReply(review.id)}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <MessageCircle className="w-3.5 h-3.5 mr-1" />
                        Trả lời
                      </Button>
                      
                      {review.replies && review.replies.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleReplies(review.id)}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <CornerDownRight className="w-3.5 h-3.5 mr-1" />
                          {expandedReplies.has(review.id) ? 'Ẩn' : 'Xem'} {review.replies.length} trả lời
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Replies Section */}
                {review.replies && review.replies.length > 0 && expandedReplies.has(review.id) && (
                  <div className="mt-3 sm:mt-4 ml-5 sm:ml-14 space-y-2.5 sm:space-y-3 border-l-2 border-muted pl-3 sm:pl-4">
                    {review.replies.map((reply) => (
                      <div key={reply.id} className="flex items-start gap-2 sm:gap-3">
                        <Avatar className="w-6 h-6 sm:w-8 sm:h-8 shrink-0">
                          <AvatarImage src={reply.user.image} alt={reply.user.name || 'User'} />
                          <AvatarFallback className="text-[10px] sm:text-xs">
                            {reply.user.name?.[0] || <User className="w-3 h-3" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                              {reply.user.name || 'User'}
                            </span>
                            {getRoleBadge(reply.user.role)}
                            <span className="text-[10px] sm:text-xs text-muted-foreground">
                              {formatDate(reply.createdAt)}
                            </span>
                            {/* Delete button for own replies or admin/staff */}
                            {session?.user && (
                              (session.user.id === reply.user.id || 
                               session.user.role === 'ADMIN' || 
                               session.user.role === 'STAFF') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteReply(review.id, reply.id)}
                                  className="h-5 w-5 p-0 ml-auto text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 break-words">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                {replyingTo === review.id && (
                  <div className="mt-3 sm:mt-4 ml-5 sm:ml-14 border-l-2 border-primary/30 pl-3 sm:pl-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <Avatar className="w-6 h-6 sm:w-8 sm:h-8 shrink-0">
                        <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || 'You'} />
                        <AvatarFallback className="text-[10px] sm:text-xs">
                          {session?.user?.name?.[0] || <User className="w-3 h-3" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-2">
                        <Textarea
                          placeholder="Viết trả lời..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          className="min-h-[60px] sm:min-h-[80px] text-xs sm:text-sm resize-none"
                          maxLength={2000}
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] sm:text-xs text-muted-foreground">
                            {replyContent.length}/2000
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setReplyingTo(null)
                                setReplyContent('')
                              }}
                              className="h-7 sm:h-8 text-xs"
                            >
                              <X className="w-3.5 h-3.5 mr-1" />
                              Hủy
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => submitReply(review.id)}
                              disabled={submittingReply || !replyContent.trim()}
                              className="h-7 sm:h-8 text-xs"
                            >
                              {submittingReply ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5 mr-1" />
                              )}
                              Gửi
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
              className="min-w-32 h-9 text-sm"
            >
              {loadingMore ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
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
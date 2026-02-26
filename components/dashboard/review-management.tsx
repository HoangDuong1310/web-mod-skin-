'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  Search, Star, Eye, EyeOff, CheckCircle, XCircle, Clock, Filter, Trash2,
  MessageCircle, Send, Loader2, CornerDownRight, Shield, User
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
  productId: string
  rating: number
  title: string
  content: string
  userId?: string
  guestName?: string
  guestEmail?: string
  isVerified: boolean
  isVisible: boolean
  createdAt: string
  product: {
    id: string
    title: string
    slug: string
  }
  user?: {
    id: string
    name: string
    email: string
  }
  replies?: ReviewReply[]
}

interface ReviewStats {
  total: number
  pending: number
  approved: number
  hidden: number
}

export default function ReviewManagement() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats>({
    total: 0,
    pending: 0,
    approved: 0,
    hidden: 0
  })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  
  // Detail dialog state
  const [detailDialog, setDetailDialog] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)

  // Reply states
  const [replyContent, setReplyContent] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [dialogReplies, setDialogReplies] = useState<ReviewReply[]>([])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      
      if (search) params.append('search', search)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/admin/reviews?${params}`)
      if (!response.ok) throw new Error('Failed to fetch reviews')
      
      const data = await response.json()
      setReviews(data.reviews)
      setStats(data.stats)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast.error('Failed to fetch reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [page, search, statusFilter])

  const fetchReplies = async (reviewId: string) => {
    try {
      setLoadingReplies(true)
      const response = await fetch(`/api/reviews/replies?reviewId=${reviewId}`)
      if (!response.ok) throw new Error('Failed to fetch replies')
      const data = await response.json()
      setDialogReplies(data.replies)
    } catch (error) {
      console.error('Error fetching replies:', error)
      toast.error('Failed to load replies')
    } finally {
      setLoadingReplies(false)
    }
  }

  const openDetailDialog = (review: Review) => {
    setSelectedReview(review)
    setDetailDialog(true)
    setReplyContent('')
    setDialogReplies([])
    fetchReplies(review.id)
  }

  const submitReply = async () => {
    if (!selectedReview || !replyContent.trim()) return

    try {
      setSubmittingReply(true)
      const response = await fetch('/api/reviews/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: selectedReview.id,
          content: replyContent.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit reply')
      }

      const data = await response.json()
      setDialogReplies(prev => [...prev, data.reply])
      setReplyContent('')
      toast.success('Reply submitted successfully')
    } catch (error) {
      console.error('Error submitting reply:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit reply')
    } finally {
      setSubmittingReply(false)
    }
  }

  const deleteReply = async (replyId: string) => {
    try {
      const response = await fetch(`/api/reviews/replies?id=${replyId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete reply')

      setDialogReplies(prev => prev.filter(r => r.id !== replyId))
      toast.success('Reply deleted successfully')
    } catch (error) {
      console.error('Error deleting reply:', error)
      toast.error('Failed to delete reply')
    }
  }

  const handleReviewAction = async (reviewId: string, action: 'approve' | 'hide' | 'show' | 'delete') => {
    try {
      if (action === 'delete') {
        const response = await fetch(`/api/admin/reviews?id=${reviewId}`, {
          method: 'DELETE'
        })
        if (!response.ok) throw new Error('Failed to delete review')
        
        setReviews(reviews.filter(review => review.id !== reviewId))
        toast.success('Review deleted successfully')
      } else {
        const updateData = {
          id: reviewId,
          isVerified: action === 'approve' ? true : reviews.find(r => r.id === reviewId)?.isVerified,
          isVisible: action === 'hide' ? false : action === 'show' ? true : reviews.find(r => r.id === reviewId)?.isVisible
        }

        const response = await fetch('/api/admin/reviews', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        })

        if (!response.ok) throw new Error('Failed to update review')

        const data = await response.json()
        
        // Update review in list
        setReviews(reviews.map(review => 
          review.id === reviewId ? data.review : review
        ))

        toast.success(`Review ${action}d successfully`)
      }
      
      // Refresh stats
      fetchReviews()
    } catch (error) {
      console.error('Error updating review:', error)
      toast.error(`Failed to ${action} review`)
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 sm:h-4 sm:w-4 ${
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ))
  }

  const getStatusBadge = (review: Review) => {
    if (!review.isVerified) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 text-[10px] sm:text-xs">
          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
          Pending
        </Badge>
      )
    }
    if (!review.isVisible) {
      return (
        <Badge className="bg-red-100 text-red-800 text-[10px] sm:text-xs">
          <EyeOff className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
          Hidden
        </Badge>
      )
    }
    return (
      <Badge className="bg-green-100 text-green-800 text-[10px] sm:text-xs">
        <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
        Approved
      </Badge>
    )
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAuthorName = (review: Review) => {
    if (review.user) return review.user.name
    if (review.guestName) return review.guestName
    return 'Anonymous'
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Reviews</CardTitle>
            <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-600" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Hidden</CardTitle>
            <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.hidden}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="px-3 sm:px-6">
          <CardTitle className="text-base sm:text-lg">Review Management</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-9 text-sm"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-sm">
                  <Filter className="h-3.5 w-3.5 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mobile: Card layout, Desktop: Table layout */}
          {/* Desktop Table */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      Loading reviews...
                    </TableCell>
                  </TableRow>
                ) : reviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      No reviews found
                    </TableCell>
                  </TableRow>
                ) : (
                  reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{review.product.title}</div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{getAuthorName(review)}</div>
                          {review.user ? (
                            <div className="text-xs text-muted-foreground">{review.user.email}</div>
                          ) : review.guestEmail ? (
                            <div className="text-xs text-muted-foreground">{review.guestEmail}</div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-0.5">
                          {renderStars(review.rating)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div>
                          <div className="font-medium text-sm">{review.title}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {review.content}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(review)}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatDate(review.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetailDialog(review)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetailDialog(review)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                            title="Reply"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </Button>
                          
                          {!review.isVerified && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReviewAction(review.id, 'approve')}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          
                          {review.isVisible ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReviewAction(review.id, 'hide')}
                              className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                            >
                              <EyeOff className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReviewAction(review.id, 'show')}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReviewAction(review.id, 'delete')}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-3">
            {loading ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                Loading reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                No reviews found
              </div>
            ) : (
              reviews.map((review) => (
                <Card key={review.id} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{review.product.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{getAuthorName(review)}</div>
                      </div>
                      {getStatusBadge(review)}
                    </div>

                    <div className="flex items-center gap-0.5 mb-1.5">
                      {renderStars(review.rating)}
                      <span className="text-xs text-muted-foreground ml-1">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>

                    <div className="mb-2">
                      <div className="font-medium text-xs">{review.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{review.content}</div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailDialog(review)}
                        className="h-7 px-2 text-xs flex-1"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailDialog(review)}
                        className="h-7 px-2 text-xs text-blue-600 flex-1"
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                      
                      {!review.isVerified && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReviewAction(review.id, 'approve')}
                          className="h-7 w-7 p-0 text-green-600"
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                      )}
                      
                      {review.isVisible ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReviewAction(review.id, 'hide')}
                          className="h-7 w-7 p-0 text-orange-600"
                        >
                          <EyeOff className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReviewAction(review.id, 'show')}
                          className="h-7 w-7 p-0 text-blue-600"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReviewAction(review.id, 'delete')}
                        className="h-7 w-7 p-0 text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
              <div className="text-xs sm:text-sm text-muted-foreground">
                {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="h-8 text-xs"
                >
                  Previous
                </Button>
                <span className="text-xs sm:text-sm">
                  {pagination.page} / {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.pages}
                  className="h-8 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Detail Dialog with Reply */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Review Details</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <h4 className="font-medium text-sm">Product</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">{selectedReview.product.title}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm">Author</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">{getAuthorName(selectedReview)}</p>
                  {selectedReview.user?.email && (
                    <p className="text-xs text-muted-foreground">{selectedReview.user.email}</p>
                  )}
                  {selectedReview.guestEmail && (
                    <p className="text-xs text-muted-foreground">{selectedReview.guestEmail}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-1">Rating</h4>
                <div className="flex items-center space-x-1">
                  {renderStars(selectedReview.rating)}
                  <span className="ml-2 font-medium text-sm">({selectedReview.rating}/5)</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-1">Review Title</h4>
                <p className="text-xs sm:text-sm">{selectedReview.title}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-1">Review Content</h4>
                <p className="text-xs sm:text-sm whitespace-pre-wrap">{selectedReview.content}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <h4 className="font-medium text-sm">Status</h4>
                  <div className="mt-1">{getStatusBadge(selectedReview)}</div>
                </div>
                <div>
                  <h4 className="font-medium text-sm">Date</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{formatDate(selectedReview.createdAt)}</p>
                </div>
              </div>

              {/* Replies Section */}
              <Separator />
              <div>
                <h4 className="font-medium text-sm mb-3 flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4" />
                  Replies ({dialogReplies.length})
                </h4>

                {loadingReplies ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Loading replies...</span>
                  </div>
                ) : dialogReplies.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    {dialogReplies.map((reply) => (
                      <div key={reply.id} className="flex items-start gap-2 sm:gap-3 bg-muted/50 rounded-lg p-2.5 sm:p-3">
                        <Avatar className="w-6 h-6 sm:w-8 sm:h-8 shrink-0">
                          <AvatarImage src={reply.user.image} alt={reply.user.name || 'User'} />
                          <AvatarFallback className="text-[10px] sm:text-xs">
                            {reply.user.name?.[0] || <User className="w-3 h-3" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-xs sm:text-sm">{reply.user.name || 'User'}</span>
                            {getRoleBadge(reply.user.role)}
                            <span className="text-[10px] sm:text-xs text-muted-foreground">
                              {formatDate(reply.createdAt)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteReply(reply.id)}
                              className="h-5 w-5 p-0 ml-auto text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">No replies yet.</p>
                )}

                {/* Reply Form */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Write a reply as admin/staff..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[60px] sm:min-h-[80px] text-xs sm:text-sm resize-none"
                    maxLength={2000}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      {replyContent.length}/2000
                    </span>
                    <Button
                      size="sm"
                      onClick={submitReply}
                      disabled={submittingReply || !replyContent.trim()}
                      className="h-8 text-xs"
                    >
                      {submittingReply ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5 mr-1" />
                      )}
                      Send Reply
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setDetailDialog(false)} className="text-xs h-8">
                  Close
                </Button>
                {!selectedReview.isVerified && (
                  <Button 
                    size="sm"
                    onClick={() => {
                      handleReviewAction(selectedReview.id, 'approve')
                      setDetailDialog(false)
                    }}
                    className="bg-green-600 hover:bg-green-700 text-xs h-8"
                  >
                    Approve
                  </Button>
                )}
                {selectedReview.isVisible ? (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleReviewAction(selectedReview.id, 'hide')
                      setDetailDialog(false)
                    }}
                    className="text-orange-600 border-orange-600 hover:bg-orange-50 text-xs h-8"
                  >
                    Hide
                  </Button>
                ) : (
                  <Button 
                    size="sm"
                    onClick={() => {
                      handleReviewAction(selectedReview.id, 'show')
                      setDetailDialog(false)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-xs h-8"
                  >
                    Show
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
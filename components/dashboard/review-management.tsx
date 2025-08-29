'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Search, Star, Eye, EyeOff, CheckCircle, XCircle, Clock, Filter, Trash2 } from 'lucide-react'

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
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ))
  }

  const getStatusBadge = (review: Review) => {
    if (!review.isVerified) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    }
    if (!review.isVisible) {
      return (
        <Badge className="bg-red-100 text-red-800">
          <EyeOff className="h-3 w-3 mr-1" />
          Hidden
        </Badge>
      )
    }
    return (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Approved
      </Badge>
    )
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
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hidden</CardTitle>
            <EyeOff className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.hidden}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Review Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews by content, author, or product..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
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

          {/* Reviews Table */}
          <div className="rounded-md border">
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
                        <div className="font-medium">{review.product.title}</div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{getAuthorName(review)}</div>
                          {review.user ? (
                            <div className="text-sm text-muted-foreground">{review.user.email}</div>
                          ) : review.guestEmail ? (
                            <div className="text-sm text-muted-foreground">{review.guestEmail}</div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {renderStars(review.rating)}
                          <span className="ml-1 text-sm font-medium">({review.rating})</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div>
                          <div className="font-medium text-sm">{review.title}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {review.content}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(review)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(review.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedReview(review)
                              setDetailDialog(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {!review.isVerified && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReviewAction(review.id, 'approve')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {review.isVisible ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReviewAction(review.id, 'hide')}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <EyeOff className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReviewAction(review.id, 'show')}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReviewAction(review.id, 'delete')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} reviews
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Detail Dialog */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Product</h4>
                  <p className="text-sm text-muted-foreground">{selectedReview.product.title}</p>
                </div>
                <div>
                  <h4 className="font-medium">Author</h4>
                  <p className="text-sm text-muted-foreground">{getAuthorName(selectedReview)}</p>
                  {selectedReview.user?.email && (
                    <p className="text-xs text-muted-foreground">{selectedReview.user.email}</p>
                  )}
                  {selectedReview.guestEmail && (
                    <p className="text-xs text-muted-foreground">{selectedReview.guestEmail}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Rating</h4>
                <div className="flex items-center space-x-1">
                  {renderStars(selectedReview.rating)}
                  <span className="ml-2 font-medium">({selectedReview.rating}/5)</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Review Title</h4>
                <p className="text-sm">{selectedReview.title}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Review Content</h4>
                <p className="text-sm whitespace-pre-wrap">{selectedReview.content}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Status</h4>
                  {getStatusBadge(selectedReview)}
                </div>
                <div>
                  <h4 className="font-medium">Date</h4>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedReview.createdAt)}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setDetailDialog(false)}>
                  Close
                </Button>
                {!selectedReview.isVerified && (
                  <Button 
                    onClick={() => {
                      handleReviewAction(selectedReview.id, 'approve')
                      setDetailDialog(false)
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve Review
                  </Button>
                )}
                {selectedReview.isVisible ? (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      handleReviewAction(selectedReview.id, 'hide')
                      setDetailDialog(false)
                    }}
                    className="text-orange-600 border-orange-600 hover:bg-orange-50"
                  >
                    Hide Review
                  </Button>
                ) : (
                  <Button 
                    onClick={() => {
                      handleReviewAction(selectedReview.id, 'show')
                      setDetailDialog(false)
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Show Review
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

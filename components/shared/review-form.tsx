'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StarRating } from '@/components/ui/star-rating'
import { toast } from 'sonner'

interface ReviewFormProps {
  productId: string
  onReviewCreated?: () => void
}

interface ExistingReview {
  id: string
  rating: number
  title: string
  content: string
  createdAt: string
}

export function ReviewForm({ productId, onReviewCreated }: ReviewFormProps) {
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [canReview, setCanReview] = useState(true)
  const [existingReview, setExistingReview] = useState<ExistingReview | null>(null)
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')

  // Check if user has already reviewed this product
  useEffect(() => {
    const checkReviewStatus = async () => {
      if (!productId) return

      try {
        const response = await fetch(`/api/reviews/check?productId=${productId}`)
        if (response.ok) {
          const data = await response.json()
          setCanReview(data.canReview)
          setExistingReview(data.existingReview)
        }
      } catch (error) {
        console.error('Error checking review status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkReviewStatus()
  }, [productId, session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    if (!title.trim()) {
      toast.error('Please provide a review title')
      return
    }

    if (title.trim().length > 200) {
      toast.error('Title must not exceed 200 characters')
      return
    }

    if (!content.trim()) {
      toast.error('Please write your review')
      return
    }

    if (content.trim().length < 10) {
      toast.error('Review must be at least 10 characters')
      return
    }

    if (content.trim().length > 2000) {
      toast.error('Review must not exceed 2000 characters')
      return
    }

    if (!session && (!guestName.trim() || !guestEmail.trim())) {
      toast.error('Please provide your name and email')
      return
    }

    if (!session && guestName.trim().length > 100) {
      toast.error('Name must not exceed 100 characters')
      return
    }

    if (!session && guestEmail.trim() && !/\S+@\S+\.\S+/.test(guestEmail.trim())) {
      toast.error('Please provide a valid email address')
      return
    }

    if (!productId) {
      toast.error('Product ID is missing')
      return
    }

    setIsSubmitting(true)

    try {
      const requestBody = {
        productId,
        rating,
        title: title.trim(),
        content: content.trim(),
        guestName: !session ? guestName.trim() : undefined,
        guestEmail: !session ? guestEmail.trim() : undefined,
      }
      
      console.log('🔵 Submitting review with data:', requestBody)
      
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('🔵 Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.log('🔴 Error response:', errorData)
        
        // Handle filter block specifically
        if (errorData.filterAction === 'block') {
          throw new Error(errorData.error || 'Nội dung review vi phạm quy tắc cộng đồng.')
        }
        
        // If there are validation details, show them
        if (errorData.details && Array.isArray(errorData.details)) {
          const errorMessages = errorData.details.map((detail: any) => `${detail.field}: ${detail.message}`).join(', ')
          throw new Error(`${errorData.error}: ${errorMessages}`)
        }
        
        throw new Error(errorData.error || 'Failed to submit review')
      }

      const responseData = await response.json()

      // Show appropriate message based on filter result
      if (responseData.filterAction === 'hide' || responseData.filterAction === 'pending_approval') {
        toast.success('Review đã được gửi và đang chờ quản trị viên duyệt.')
      } else {
        toast.success('Review submitted successfully!')
      }
      
      // Reset form
      setRating(0)
      setTitle('')
      setContent('')
      setGuestName('')
      setGuestEmail('')

      // Notify parent component
      onReviewCreated?.()
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Write a Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Loading...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!canReview && existingReview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <StarRating rating={existingReview.rating} size="sm" />
                <span className="text-sm text-muted-foreground">
                  Reviewed on {new Date(existingReview.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h4 className="font-medium mb-1">{existingReview.title}</h4>
              <p className="text-sm text-muted-foreground">{existingReview.content}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              You have already reviewed this product. Thank you for your feedback!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div>
            <Label>Rating *</Label>
            <div className="mt-2">
              <StarRating
                rating={rating}
                size="lg"
                interactive
                onChange={setRating}
              />
              {rating > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </p>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Review Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              maxLength={200}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {title.length}/200 characters
            </p>
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content">Review Content *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tell others about your experience with this app..."
              rows={4}
              maxLength={2000}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {content.length}/2000 characters
            </p>
          </div>

          {/* Guest Information */}
          {!session && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="guestName">Your Name *</Label>
                <Input
                  id="guestName"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <Label htmlFor="guestEmail">Your Email *</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email won't be displayed publicly
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>

          {session && (
            <p className="text-xs text-muted-foreground text-center">
              Posting as {session.user?.name || session.user?.email}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
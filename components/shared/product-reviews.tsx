'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReviewList } from '@/components/shared/review-list'
import { ReviewForm } from '@/components/shared/review-form'

interface ProductReviewsProps {
  productId: string
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleReviewCreated = () => {
    // Trigger refresh of review list
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div id="product-reviews" data-section="product-reviews" className="mt-8">
      <Tabs defaultValue="reviews" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="write">Write Review</TabsTrigger>
        </TabsList>
        
        <TabsContent value="reviews" className="mt-6">
          <ReviewList 
            productId={productId} 
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>
        
        <TabsContent value="write" className="mt-6">
          <ReviewForm 
            productId={productId}
            onReviewCreated={handleReviewCreated}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ReviewsOverviewData {
  totalReviews: number
  averageRating: number
  pendingReviews: number
  reportedReviews: number
  ratingDistribution: Record<number, number>
}

export function ReviewsOverview() {
  const [data, setData] = useState<ReviewsOverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReviewsOverview() {
      try {
        const response = await fetch('/api/admin/reviews-overview')
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (error) {
        console.error('Failed to fetch reviews overview:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReviewsOverview()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reviews Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  const stats = [
    {
      label: 'Total Reviews',
      value: data.totalReviews.toLocaleString(),
      icon: Star,
      color: 'text-blue-600',
    },
    {
      label: 'Average Rating',
      value: `${Number(data.averageRating).toFixed(1)} ⭐`,
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      label: 'Pending Reviews',
      value: data.pendingReviews.toString(),
      icon: AlertTriangle,
      color: 'text-yellow-600',
    },
    {
      label: 'Reported Reviews',
      value: data.reportedReviews.toString(),
      icon: CheckCircle,
      color: 'text-red-600',
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Reviews Overview</CardTitle>
          <CardDescription>
            Monitor review activity and quality across your platform
          </CardDescription>
        </div>
        <Button variant="outline" size="sm">
          Manage Reviews
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted mb-2 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Rating Distribution</h4>
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = data.ratingDistribution[rating] || 0
            const percentage = data.totalReviews > 0 ? (count / data.totalReviews) * 100 : 0
            
            return (
              <div key={rating} className="flex items-center gap-2 text-sm">
                <span className="w-8">{rating}★</span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-12 text-right text-muted-foreground">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

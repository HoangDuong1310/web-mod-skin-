'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDistanceToNow } from 'date-fns'
import { 
  Download, 
  MessageSquare, 
  Heart, 
  FileUp,
  Star,
  TrendingUp,
  Package,
  Image
} from 'lucide-react'
import Link from 'next/link'

interface RecentActivitiesProps {
  activities: any
  topContent: any
}

export function RecentActivities({ activities, topContent }: RecentActivitiesProps) {
  if (!activities) return null

  const formatCurrency = (amount: any) => {
    const num = parseFloat(amount || 0)
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'APPROVED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'NEEDS_REVISION':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
      {/* Recent Activities */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Latest actions on your platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="downloads" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="downloads" className="text-xs px-2">
                <Download className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Downloads</span>
              </TabsTrigger>
              <TabsTrigger value="reviews" className="text-xs px-2">
                <MessageSquare className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Reviews</span>
              </TabsTrigger>
              <TabsTrigger value="donations" className="text-xs px-2">
                <Heart className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Donations</span>
              </TabsTrigger>
              <TabsTrigger value="submissions" className="text-xs px-2">
                <FileUp className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Submissions</span>
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px] mt-4">
              {/* Downloads Tab */}
              <TabsContent value="downloads" className="space-y-3">
                {activities.downloads?.length > 0 ? (
                  activities.downloads.map((download: any) => (
                    <div key={download.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {download.userName?.charAt(0) || 'G'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">
                          {download.userName || 'Guest'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Downloaded <span className="font-medium text-foreground">{download.productTitle}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(download.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent downloads</p>
                )}
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-3">
                {activities.reviews?.length > 0 ? (
                  activities.reviews.map((review: any) => (
                    <div key={review.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {review.userName?.charAt(0) || 'G'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{review.userName || 'Guest'}</p>
                          <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-3 w-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs font-medium">{review.title}</p>
                        <p className="text-xs text-muted-foreground">
                          on <span className="font-medium">{review.productTitle}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent reviews</p>
                )}
              </TabsContent>

              {/* Donations Tab */}
              <TabsContent value="donations" className="space-y-3">
                {activities.donations?.length > 0 ? (
                  activities.donations.map((donation: any) => (
                    <div key={donation.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400">
                          <Heart className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">
                          {donation.donorName}
                        </p>
                        <p className="text-sm font-bold text-pink-600">
                          {formatCurrency(donation.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(donation.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300">
                        Completed
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent donations</p>
                )}
              </TabsContent>

              {/* Submissions Tab */}
              <TabsContent value="submissions" className="space-y-3">
                {activities.submissions?.length > 0 ? (
                  activities.submissions.map((submission: any) => (
                    <div key={submission.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {submission.submitterName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">
                          {submission.submitterName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Submitted <span className="font-medium text-foreground">{submission.name}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          for {submission.championName}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${getStatusColor(submission.status)}`}>
                            {submission.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent submissions</p>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>

      {/* Top Content */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Top Content</CardTitle>
          <CardDescription>Most popular items on your platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="products">
                <Package className="h-4 w-4 mr-2" />
                Products
              </TabsTrigger>
              <TabsTrigger value="skins">
                <Image className="h-4 w-4 mr-2" />
                Custom Skins
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px] mt-4">
              {/* Top Products */}
              <TabsContent value="products" className="space-y-3">
                {topContent?.products?.length > 0 ? (
                  topContent.products.map((product: any, index: number) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="block"
                    >
                      <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {product.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1">
                              <Download className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {product.downloads} downloads
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                              <span className="text-xs text-muted-foreground">
                                {Number(product.rating).toFixed(1)} ({product.reviews})
                              </span>
                            </div>
                          </div>
                        </div>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No products yet</p>
                )}
              </TabsContent>

              {/* Top Skins */}
              <TabsContent value="skins" className="space-y-3">
                {topContent?.skins?.length > 0 ? (
                  topContent.skins.map((skin: any, index: number) => (
                    <Link
                      key={skin.id}
                      href={`/custom-skins/${skin.id}`}
                      className="block"
                    >
                      <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {skin.name}
                          </p>
                          <div className="flex flex-col gap-1 mt-1">
                            <p className="text-xs text-muted-foreground">
                              for {skin.championName} • by {skin.authorName}
                            </p>
                            <div className="flex items-center gap-1">
                              <Download className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {skin.downloads} downloads
                              </span>
                            </div>
                          </div>
                        </div>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No skins yet</p>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

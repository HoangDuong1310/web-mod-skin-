import type { Metadata } from 'next'
import { ProductReviews } from '@/components/shared/product-reviews'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, Star, Shield, Zap } from 'lucide-react'

// This would normally come from your database
const sampleProduct = {
  id: "cmeue26vh000o1043bzsvwrnq", // Use actual product ID from database
  title: "Advanced Photo Editor Pro",
  description: "Professional photo editing software with AI-powered tools",
  version: "2.1.4",
  size: "156 MB",
  price: 0, // Free software
  category: "Graphics & Design",
  publisher: "TechStudio Inc",
  rating: 4.3,
  totalReviews: 127,
  downloads: 15420,
  features: [
    "AI-powered background removal",
    "Advanced color correction",
    "Batch processing",
    "RAW file support",
    "Cloud sync"
  ]
}

export const metadata: Metadata = {
  title: `${sampleProduct.title} - Download & Reviews`,
  description: sampleProduct.description,
}

export default function SampleProductPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <span>Home</span>
        <span>/</span>
        <span>{sampleProduct.category}</span>
        <span>/</span>
        <span className="text-foreground">{sampleProduct.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Product header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold">{sampleProduct.title}</h1>
                  <p className="text-muted-foreground">{sampleProduct.description}</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{sampleProduct.rating}</span>
                      <span className="text-muted-foreground">({sampleProduct.totalReviews} reviews)</span>
                    </div>
                    <Badge variant="secondary">{sampleProduct.category}</Badge>
                    <Badge variant="outline">Free</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Version:</span>
                  <div className="font-medium">{sampleProduct.version}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Size:</span>
                  <div className="font-medium">{sampleProduct.size}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Publisher:</span>
                  <div className="font-medium">{sampleProduct.publisher}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Downloads:</span>
                  <div className="font-medium">{sampleProduct.downloads.toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Key Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sampleProduct.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reviews Section - This is the main demo */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Reviews & Ratings</h2>
            <ProductReviews productId={sampleProduct.id} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Download Card */}
          <Card>
            <CardHeader>
              <CardTitle>Download</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button size="lg" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Free
              </Button>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  <span>Virus-free and secure</span>
                </div>
                <div>Compatible with Windows 10/11</div>
                <div>No registration required</div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average Rating</span>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{sampleProduct.rating}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Reviews</span>
                <span className="font-medium">{sampleProduct.totalReviews}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Downloads</span>
                <span className="font-medium">{sampleProduct.downloads.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* System Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>System Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium">OS:</span> Windows 10/11
              </div>
              <div>
                <span className="font-medium">RAM:</span> 4 GB minimum
              </div>
              <div>
                <span className="font-medium">Storage:</span> 200 MB available space
              </div>
              <div>
                <span className="font-medium">Graphics:</span> DirectX 11 compatible
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

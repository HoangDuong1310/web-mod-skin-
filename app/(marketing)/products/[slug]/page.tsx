import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { StarRating } from '@/components/ui/star-rating'
import { ProductReviews } from '@/components/shared/product-reviews'
import DownloadActions from '@/components/product/download-actions'
import { prisma } from '@/lib/prisma'
import { formatPrice, formatDate } from '@/lib/utils'
import { generateDynamicMetadata } from '@/lib/dynamic-seo'
import { generateProductSchema } from '@/lib/seo'
import {
  Download, 
  Star, 
  Shield, 
  Smartphone, 
  Monitor, 
  Calendar,
  Package,
  Users,
  ArrowLeft,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

// Always render dynamically to reflect latest DB data immediately
export const dynamic = 'force-dynamic'

interface ProductPageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: params.slug, deletedAt: null },
      include: { category: true },
    })

    if (!product) {
      return generateDynamicMetadata({
        title: 'App Not Found',
        description: 'The requested application could not be found.',
      })
    }

    return generateDynamicMetadata({
      title: product.metaTitle || product.title,
      description: product.metaDescription || product.description || '',
      keywords: [product.title, product.category?.name || '', 'download', 'app', 'software'],
      image: (() => {
        // Safely parse images for metadata
        if (product.images) {
          try {
            const images = Array.isArray(product.images) 
              ? product.images 
              : typeof product.images === 'string' 
                ? JSON.parse(product.images)
                : []
            
            if (images.length > 0 && typeof images[0] === 'string' && images[0].length > 1) {
              const imageUrl = images[0]
              return (imageUrl.startsWith('/') || imageUrl.startsWith('http')) ? imageUrl : undefined
            }
          } catch (error) {
            console.error('Error parsing product images for metadata:', error)
          }
        }
        return undefined
      })(),
      url: `/products/${product.slug}`,
      type: 'website',
    })
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'App Details',
      description: 'Download and discover amazing applications.',
    }
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  console.log('🔍 ProductPage called with params:', params)
  console.log('🔍 Looking for slug:', params.slug)
  
  try {
    const product = await prisma.product.findUnique({
      where: {
        slug: params.slug,
        status: 'PUBLISHED',
        deletedAt: null,
      },
      include: {
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    })

    console.log('🔍 Database query result:', product ? 'Found product' : 'Product not found')
    if (product) {
      console.log('🔍 Product details:', { id: product.id, title: product.title, slug: product.slug })
    }

    if (!product) {
      console.log('🚨 Product not found, calling notFound()')
      notFound()
    }

    // Use pre-calculated rating and review count from database
    const rating = Number(product.averageRating) || 0
    const reviewCount = product.totalReviews || 0

    // Get real download count
    const downloadCount = await prisma.download.count({
      where: { productId: product.id }
    })

    // Generate structured data
    const productSchema = generateProductSchema({
      name: product.title,
      description: product.description || '',
      image: product.images as string[],
      price: Number(product.price),
      currency: 'USD',
      availability: product.stock > 0 ? 'InStock' : 'OutOfStock',
      category: product.category?.name || 'Software',
      url: `/products/${product.slug}`,
      reviews: {
        reviewCount: reviewCount,
        ratingValue: rating || 4.8,
      },
    })

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
        
        <div className="container py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-primary">Apps</Link>
            <span>/</span>
            <span>{product.title}</span>
          </div>

          {/* Back button */}
          <Link href="/products" className="inline-flex items-center mb-6 text-sm font-medium transition-colors hover:text-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Apps
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Hero Section */}
              <div className="mb-8">
                <div className="flex items-start gap-6 mb-6">
                  {/* App Icon */}
                  {(() => {
                    // Safely parse and validate images for app icon
                    let iconUrl = null
                    if (product.images) {
                      try {
                        const images = Array.isArray(product.images) 
                          ? product.images 
                          : typeof product.images === 'string' 
                            ? JSON.parse(product.images)
                            : []
                        
                        if (images.length > 0 && typeof images[0] === 'string' && images[0].length > 1) {
                          iconUrl = images[0]
                        }
                      } catch (error) {
                        console.error('Error parsing product images for icon:', error)
                      }
                    }
                    
                    return iconUrl && (iconUrl.startsWith('/') || iconUrl.startsWith('http')) ? (
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={iconUrl}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                        <div className="text-muted-foreground text-xs">No Icon</div>
                      </div>
                    )
                  })()}

                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
                    
                    <div className="flex items-center gap-4 mb-3">
                      {product.category && (
                        <Badge variant="secondary">
                          {product.category.name}
                        </Badge>
                      )}
                      {reviewCount > 0 ? (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <StarRating rating={rating} size="sm" />
                          <span className="ml-1">
                            {rating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No reviews yet
                        </div>
                      )}
                    </div>

                    <p className="text-lg text-muted-foreground">
                      {product.description}
                    </p>
                  </div>
                </div>

                {/* Screenshots */}
                {(() => {
                  // Safely parse and validate images for screenshots
                  let screenshots: string[] = []
                  if (product.images) {
                    try {
                      const images = Array.isArray(product.images) 
                        ? product.images 
                        : typeof product.images === 'string' 
                          ? JSON.parse(product.images)
                          : []
                      
                      screenshots = images.filter((img: any, index: number) => 
                        index > 0 && 
                        typeof img === 'string' && 
                        img.length > 1 && 
                        (img.startsWith('/') || img.startsWith('http'))
                      )
                    } catch (error) {
                      console.error('Error parsing product images for screenshots:', error)
                    }
                  }
                  
                  return screenshots.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {screenshots.map((image: string, index: number) => (
                        <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                          <Image
                            src={image}
                            alt={`${product.title} screenshot ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : null
                })()}
              </div>

              {/* Description */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>About This App</CardTitle>
                </CardHeader>
                <CardContent>
                  {product.content ? (
                    <div 
                      className="prose prose-neutral dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: product.content }}
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      {product.description}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Features */}
              <Card>
                <CardHeader>
                  <CardTitle>Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-green-600" />
                      <span>Safe & Secure</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-blue-600" />
                      <span>Regular Updates</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span>Community Support</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {product.category?.slug === 'smartphones' ? (
                        <Smartphone className="w-5 h-5 text-orange-600" />
                      ) : (
                        <Monitor className="w-5 h-5 text-orange-600" />
                      )}
                      <span>Cross-Platform</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Download Card */}
              <Card>
                <CardHeader>
                  <div className="text-center">
                    {product.price.toString() === "0" || product.price.toString() === "0.00" ? (
                      <div className="text-3xl font-bold text-green-600 mb-2">FREE</div>
                    ) : (
                      <>
                        <div className="text-3xl font-bold text-primary mb-1">
                          {formatPrice(Number(product.price))}
                        </div>
                        {product.comparePrice && (
                          <div className="text-lg text-muted-foreground line-through">
                            {formatPrice(Number(product.comparePrice))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <DownloadActions 
                    productId={product.id}
                    hasDownloadUrl={!!(product as any).downloadUrl}
                    hasExternalUrl={!!(product as any).externalUrl}
                  />
                </CardContent>
              </Card>

              {/* App Info */}
              <Card>
                <CardHeader>
                  <CardTitle>App Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span>{product.category?.name || 'Software'}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span>{formatDate(product.updatedAt, { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Downloads</span>
                    <span>{downloadCount.toLocaleString()}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rating</span>
                    <div className="flex items-center">
                      {reviewCount > 0 ? (
                        <>
                          <StarRating rating={rating} size="sm" />
                          <span className="ml-1">{rating.toFixed(1)}/5</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">No rating</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>

          {/* Reviews Section */}
          <ProductReviews productId={product.id} />
        </div>
      </>
    )
  } catch (error) {
    console.error('Error loading product:', error)
    notFound()
  }
}

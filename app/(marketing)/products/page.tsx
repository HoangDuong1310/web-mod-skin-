import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'
import { generateDynamicMetadata } from '@/lib/dynamic-seo'
import { Download, Star, Smartphone, Monitor } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return generateDynamicMetadata({
    title: 'Apps & Software',
    description: 'Discover and download the best applications and software for your devices.',
    keywords: ['apps', 'software', 'download', 'mobile apps', 'desktop apps'],
  })
}

// Always render dynamically to avoid stale cached content
export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  try {
    const [products, totalDownloads, overallStats] = await Promise.all([
      // Get products with reviews data
      prisma.product.findMany({
        where: {
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
          _count: {
            select: {
              downloads: true,
              reviews: true,
            },
          },
        },
        orderBy: {
          downloads: {
            _count: 'desc'
          }
        },
      }),
      
      // Get total download count across all products
      prisma.download.count(),
      
      // Get overall average rating
      prisma.product.aggregate({
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
          totalReviews: { gt: 0 },
        },
        _avg: {
          averageRating: true,
        },
      }),
    ])

    return (
      <div className="container py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Apps & Software Collection
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover, download, and enjoy the best applications for your devices. 
            All apps are carefully curated and ready to download.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">{products.length}+</div>
            <div className="text-muted-foreground">Apps Available</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {totalDownloads >= 1000 
                ? `${Math.floor(totalDownloads / 1000)}K+` 
                : totalDownloads.toLocaleString()
              }
            </div>
            <div className="text-muted-foreground">Total Downloads</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {overallStats._avg.averageRating 
                ? `${Number(overallStats._avg.averageRating).toFixed(1)}★`
                : '4.8★'
              }
            </div>
            <div className="text-muted-foreground">Average Rating</div>
          </div>
        </div>

        {/* Apps Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`}>
                <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-primary/20">
                  <CardHeader className="pb-4">
                    {(() => {
                      // Safely parse and validate images
                      let imageUrl = null
                      if (product.images) {
                        try {
                          const images = Array.isArray(product.images) 
                            ? product.images 
                            : typeof product.images === 'string' 
                              ? JSON.parse(product.images)
                              : []
                          
                          if (images.length > 0 && typeof images[0] === 'string' && images[0].length > 1) {
                            imageUrl = images[0]
                          }
                        } catch (error) {
                          console.error('Error parsing product images:', error)
                        }
                      }
                      
                      return imageUrl && (imageUrl.startsWith('/') || imageUrl.startsWith('http')) ? (
                        <div className="relative aspect-video mb-4 overflow-hidden rounded-lg bg-muted">
                          <Image
                            src={imageUrl}
                            alt={product.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="relative aspect-video mb-4 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                          <div className="text-muted-foreground text-sm">No Image</div>
                        </div>
                      )
                    })()}
                    
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                          {product.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                          {product.category && (
                            <Badge variant="secondary" className="text-xs">
                              {product.category.name}
                            </Badge>
                          )}
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                            {product.totalReviews > 0
                              ? `${Number(product.averageRating).toFixed(1)} (${product.totalReviews} ${product.totalReviews === 1 ? 'review' : 'reviews'})`
                              : 'No reviews yet'
                            }
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {product.price.toString() === "0" || product.price.toString() === "0.00" ? (
                          <div className="text-xl font-bold text-green-600">FREE</div>
                        ) : (
                          <>
                            <div className="text-2xl font-bold text-primary">
                              {formatPrice(Number(product.price))}
                            </div>
                            {product.comparePrice && (
                              <div className="text-sm text-muted-foreground line-through">
                                {formatPrice(Number(product.comparePrice))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <CardDescription className="mb-4 line-clamp-2">
                      {product.description}
                    </CardDescription>

                    <div className="flex items-center justify-between gap-2 mb-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {product.category?.slug === 'smartphones' ? (
                          <Smartphone className="w-4 h-4" />
                        ) : (
                          <Monitor className="w-4 h-4" />
                        )}
                        <span>Compatible with {product.category?.name || 'All Devices'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        <span className="font-medium">{product._count.downloads.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="text-sm text-primary group-hover:text-primary/80 transition-colors">
                        Click to view details & download
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-2">No Apps Available</h3>
            <p className="text-muted-foreground">
              We're working on adding more apps. Check back soon!
            </p>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 text-center bg-muted/30 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            We're constantly adding new apps and software. 
            Contact us if you have suggestions or need help finding specific applications.
          </p>
          <Button asChild size="lg">
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading products:', error)
    
    return (
      <div className="container py-12 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="text-muted-foreground mb-6">
          We're having trouble loading the apps. Please try again later.
        </p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    )
  }
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
    description:
      'Discover and download the best applications and software for your devices.',
    keywords: ['apps', 'software', 'download', 'mobile apps', 'desktop apps'],
    url: '/products',
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
            _count: 'desc',
          },
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
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            Apps & Software Collection
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Discover, download, and enjoy the best applications for your
            devices. All apps are carefully curated and ready to download.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="text-center">
            <div className="mb-2 text-3xl font-bold text-primary">
              {products.length}+
            </div>
            <div className="text-muted-foreground">Apps Available</div>
          </div>
          <div className="text-center">
            <div className="mb-2 text-3xl font-bold text-primary">
              {totalDownloads >= 1000
                ? `${Math.floor(totalDownloads / 1000)}K+`
                : totalDownloads.toLocaleString()}
            </div>
            <div className="text-muted-foreground">Total Downloads</div>
          </div>
          <div className="text-center">
            <div className="mb-2 text-3xl font-bold text-primary">
              {overallStats._avg.averageRating
                ? `${Number(overallStats._avg.averageRating).toFixed(1)}★`
                : '4.8★'}
            </div>
            <div className="text-muted-foreground">Average Rating</div>
          </div>
        </div>

        {/* Apps Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`}>
                <Card className="group cursor-pointer transition-all duration-300 hover:border-primary/20 hover:shadow-lg">
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

                          if (
                            images.length > 0 &&
                            typeof images[0] === 'string' &&
                            images[0].length > 1
                          ) {
                            imageUrl = images[0]
                          }
                        } catch (error) {
                          console.error('Error parsing product images:', error)
                        }
                      }

                      return imageUrl &&
                        (imageUrl.startsWith('/') ||
                          imageUrl.startsWith('http')) ? (
                        <div className="relative mb-4 aspect-video overflow-hidden rounded-lg bg-muted">
                          <Image
                            src={imageUrl}
                            alt={product.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="relative mb-4 flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-muted">
                          <div className="text-sm text-muted-foreground">
                            No Image
                          </div>
                        </div>
                      )
                    })()}

                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="mb-2 text-xl transition-colors group-hover:text-primary">
                          {product.title}
                        </CardTitle>
                        <div className="mb-2 flex items-center gap-2">
                          {product.category && (
                            <Badge variant="secondary" className="text-xs">
                              {product.category.name}
                            </Badge>
                          )}
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {product.totalReviews > 0
                              ? `${Number(product.averageRating).toFixed(1)} (${product.totalReviews} ${product.totalReviews === 1 ? 'review' : 'reviews'})`
                              : 'No reviews yet'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {product.price.toString() === '0' ||
                        product.price.toString() === '0.00' ? (
                          <div className="text-xl font-bold text-green-600">
                            FREE
                          </div>
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

                    <div className="mb-4 flex items-center justify-between gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {product.category?.slug === 'smartphones' ? (
                          <Smartphone className="h-4 w-4" />
                        ) : (
                          <Monitor className="h-4 w-4" />
                        )}
                        <span>
                          Compatible with{' '}
                          {product.category?.name || 'All Devices'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        <span className="font-medium">
                          {product._count.downloads.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="text-sm text-primary transition-colors group-hover:text-primary/80">
                        Click to view details & download
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="mb-4 text-6xl">📱</div>
            <h3 className="mb-2 text-xl font-semibold">No Apps Available</h3>
            <p className="text-muted-foreground">
              We're working on adding more apps. Check back soon!
            </p>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 rounded-lg bg-muted/30 p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold">
            Can't Find What You're Looking For?
          </h2>
          <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
            We're constantly adding new apps and software. Contact us if you
            have suggestions or need help finding specific applications.
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
        <div className="mb-4 text-6xl">⚠️</div>
        <h1 className="mb-4 text-2xl font-bold">Something went wrong</h1>
        <p className="mb-6 text-muted-foreground">
          We're having trouble loading the apps. Please try again later.
        </p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    )
  }
}

import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'
import { generateDynamicMetadata } from '@/lib/dynamic-seo'
import { Download, Star, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

interface CategoryPageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: params.slug, deletedAt: null },
    })

    if (!category) {
      return generateDynamicMetadata({
        title: 'Category Not Found',
        description: 'The requested category could not be found.',
      })
    }

    return generateDynamicMetadata({
      title: category.metaTitle || `${category.name} Apps`,
      description: category.metaDescription || category.description || `Browse ${category.name} applications and software.`,
      keywords: [category.name, 'apps', 'software', 'download'],
      url: `/categories/${category.slug}`,
    })
  } catch (error) {
    console.error('Error generating metadata:', error)
    return generateDynamicMetadata({
      title: 'App Category',
      description: 'Browse apps by category.',
    })
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  try {
    const [category, products] = await Promise.all([
      prisma.category.findUnique({
        where: {
          slug: params.slug,
          status: 'PUBLISHED',
          deletedAt: null,
        },
      }),
      prisma.product.findMany({
        where: {
          category: {
            slug: params.slug,
          },
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
          reviews: {
            where: {
              isVisible: true,
              deletedAt: null,
            },
            select: {
              rating: true,
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
          createdAt: 'desc',
        },
      }),
    ])

    if (!category) {
      notFound()
    }

    return (
      <div className="container py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/categories" className="hover:text-primary">Categories</Link>
          <span>/</span>
          <span>{category.name}</span>
        </div>

        {/* Back button */}
        <Link href="/categories" className="inline-flex items-center mb-6 text-sm font-medium transition-colors hover:text-primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Categories
        </Link>

        {/* Category Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            {category.name} Apps
          </h1>
          {category.description && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {category.description}
            </p>
          )}
          <div className="mt-4">
            <Badge variant="secondary" className="text-base px-4 py-2">
              {products.length} {products.length === 1 ? 'App' : 'Apps'} Available
            </Badge>
          </div>
        </div>

        {/* Filter/Sort Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Latest</Button>
              <Button variant="ghost" size="sm">Popular</Button>
              <Button variant="ghost" size="sm">Rating</Button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Showing {products.length} results
          </div>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`}>
                <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-primary/20">
                  <CardHeader className="pb-4">
                    {product.images && (product.images as string[]).length > 0 && (
                      <div className="relative aspect-video mb-4 overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={(product.images as string[])[0]}
                          alt={product.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors">
                          {product.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                            {(() => {
                              // Calculate real rating for this product
                              const productRating = product.reviews.length > 0
                                ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
                                : 0
                              const reviewCount = product._count.reviews
                              
                              return reviewCount > 0
                                ? `${productRating.toFixed(1)} (${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'})`
                                : 'No reviews yet'
                            })()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {product.price.toString() === "0" || product.price.toString() === "0.00" ? (
                          <div className="text-lg font-bold text-green-600">FREE</div>
                        ) : (
                          <>
                            <div className="text-lg font-bold text-primary">
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

                    <div className="flex items-center justify-center">
                      <div className="text-sm text-primary group-hover:text-primary/80 transition-colors">
                        Click to view details & download
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-muted-foreground text-center">
                      Downloaded {product._count.downloads.toLocaleString()} times
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-2">No Apps Found</h3>
            <p className="text-muted-foreground mb-6">
              There are no apps in this category yet. Check back soon or browse other categories.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/products">Browse All Apps</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/categories">View Other Categories</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Related Categories */}
        {products.length > 0 && (
          <div className="mt-16 text-center bg-muted/30 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">
              Explore More Categories
            </h2>
            <p className="text-muted-foreground mb-6">
              Discover apps from other categories that might interest you.
            </p>
            <Button asChild size="lg">
              <Link href="/categories">
                View All Categories
              </Link>
            </Button>
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error('Error loading category:', error)
    notFound()
  }
}

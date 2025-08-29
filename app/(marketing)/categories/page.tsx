import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { generateMetadata } from '@/lib/seo'
import { Smartphone, Monitor, Package, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = generateMetadata({
  title: 'App Categories',
  description: 'Browse apps by categories. Find mobile apps, desktop software, and more.',
  keywords: ['app categories', 'mobile apps', 'desktop software', 'categories'],
})

export default async function CategoriesPage() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            products: {
              where: {
                status: 'PUBLISHED',
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    const getCategoryIcon = (slug: string) => {
      switch (slug) {
        case 'smartphones':
        case 'mobile':
          return Smartphone
        case 'desktop':
        case 'software':
          return Monitor
        default:
          return Package
      }
    }

    return (
      <div className="container py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            App Categories
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our collection of apps organized by categories. 
            Find exactly what you're looking for quickly and easily.
          </p>
        </div>

        {/* Categories Grid */}
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {categories.map((category) => {
              const Icon = getCategoryIcon(category.slug)
              const appCount = category._count.products
              
              return (
                <Card key={category.id} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl mb-2">{category.name}</CardTitle>
                    <Badge variant="secondary" className="w-fit mx-auto">
                      {appCount} {appCount === 1 ? 'App' : 'Apps'}
                    </Badge>
                  </CardHeader>
                  
                  <CardContent className="text-center">
                    <CardDescription className="mb-6">
                      {category.description || `Discover amazing ${category.name.toLowerCase()} applications and software.`}
                    </CardDescription>
                    
                    <Button asChild className="w-full">
                      <Link href={`/categories/${category.slug}`}>
                        Browse {category.name}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📂</div>
            <h3 className="text-xl font-semibold mb-2">No Categories Available</h3>
            <p className="text-muted-foreground">
              We're working on organizing our apps. Check back soon!
            </p>
          </div>
        )}

        {/* All Apps Section */}
        <div className="mt-16 text-center bg-muted/30 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">
            Browse All Apps
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Want to see everything we have to offer? Browse our complete collection 
            of apps and software without any category filters.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/products">
                View All Apps
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/products?sort=downloads&order=desc">
                Most Popular
              </Link>
            </Button>
          </div>
        </div>

        {/* Featured Categories */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Popular This Week</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Mobile Games', count: '50+', icon: '🎮' },
              { name: 'Productivity', count: '30+', icon: '📋' },
              { name: 'Photo & Video', count: '25+', icon: '📸' },
              { name: 'Social Media', count: '20+', icon: '💬' },
            ].map((item) => (
              <Card key={item.name} className="text-center hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="font-semibold text-sm">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.count} apps</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading categories:', error)
    
    return (
      <div className="container py-12 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="text-muted-foreground mb-6">
          We're having trouble loading the categories. Please try again later.
        </p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    )
  }
}


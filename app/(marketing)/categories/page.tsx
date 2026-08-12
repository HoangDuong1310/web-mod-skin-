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
import { generateDynamicMetadata } from '@/lib/dynamic-seo'
import { Smartphone, Monitor, Package, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return generateDynamicMetadata({
    title: 'App Categories',
    description:
      'Browse apps by categories. Find mobile apps, desktop software, and more.',
    keywords: [
      'app categories',
      'mobile apps',
      'desktop software',
      'categories',
    ],
    url: '/categories',
  })
}

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
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            App Categories
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Browse our collection of apps organized by categories. Find exactly
            what you're looking for quickly and easily.
          </p>
        </div>

        {/* Categories Grid */}
        {categories.length > 0 ? (
          <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const Icon = getCategoryIcon(category.slug)
              const appCount = category._count.products

              return (
                <Card
                  key={category.id}
                  className="group border-2 transition-all duration-300 hover:border-primary/20 hover:shadow-lg"
                >
                  <CardHeader className="pb-4 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="mb-2 text-xl">
                      {category.name}
                    </CardTitle>
                    <Badge variant="secondary" className="mx-auto w-fit">
                      {appCount} {appCount === 1 ? 'App' : 'Apps'}
                    </Badge>
                  </CardHeader>

                  <CardContent className="text-center">
                    <CardDescription className="mb-6">
                      {category.description ||
                        `Discover amazing ${category.name.toLowerCase()} applications and software.`}
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
          <div className="py-12 text-center">
            <div className="mb-4 text-6xl">📂</div>
            <h3 className="mb-2 text-xl font-semibold">
              No Categories Available
            </h3>
            <p className="text-muted-foreground">
              We're working on organizing our apps. Check back soon!
            </p>
          </div>
        )}

        {/* All Apps Section */}
        <div className="mt-16 rounded-lg bg-muted/30 p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold">Browse All Apps</h2>
          <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
            Want to see everything we have to offer? Browse our complete
            collection of apps and software without any category filters.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
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
          <h2 className="mb-8 text-center text-2xl font-bold">
            Popular This Week
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { name: 'Mobile Games', count: '50+', icon: '🎮' },
              { name: 'Productivity', count: '30+', icon: '📋' },
              { name: 'Photo & Video', count: '25+', icon: '📸' },
              { name: 'Social Media', count: '20+', icon: '💬' },
            ].map((item) => (
              <Card
                key={item.name}
                className="cursor-pointer text-center transition-shadow hover:shadow-md"
              >
                <CardContent className="p-4">
                  <div className="mb-2 text-2xl">{item.icon}</div>
                  <div className="text-sm font-semibold">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.count} apps
                  </div>
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
        <div className="mb-4 text-6xl">⚠️</div>
        <h1 className="mb-4 text-2xl font-bold">Something went wrong</h1>
        <p className="mb-6 text-muted-foreground">
          We're having trouble loading the categories. Please try again later.
        </p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    )
  }
}

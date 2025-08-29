import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { generateWebsiteSchema } from '@/lib/seo'
import { generateDynamicMetadata, getSEOSettings } from '@/lib/dynamic-seo'
import { ArrowRight, Star, Shield, Zap, Users } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  // Use dynamic SEO settings so admin changes reflect on Home
  return generateDynamicMetadata({
    title: 'Home',
    url: '/',
  })
}

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized for speed and modern best practices.',
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Built with security in mind using industry-standard practices.',
  },
  {
    icon: Users,
    title: 'User-Friendly',
    description: 'Intuitive interface designed for the best user experience.',
  },
]

// Testimonials are now loaded dynamically from reviews

export default async function HomePage() {
  const websiteSchema = generateWebsiteSchema()
  const settings = await getSEOSettings()

  // Load latest visible reviews for testimonials section
  const reviews = await prisma.review.findMany({
    where: {
      isVisible: true,
      deletedAt: null,
      rating: 5,
      product: { is: { deletedAt: null } },
    },
    include: {
      user: {
        select: { name: true, image: true },
      },
      product: {
        select: { title: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background to-muted/20 py-24 sm:py-32">
        {/* Background image */}
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('/images/img.jpg')" }}
          aria-hidden="true"
        />
        {/* Overlay to improve text contrast */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background/80 to-muted/40" aria-hidden="true" />
        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                {settings.siteName}
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              {settings.siteDescription || 'Discover amazing applications, download instantly, and experience the next generation of software with our modern platform.'}
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/products" className="inline-flex items-center justify-center h-12 px-8 text-lg font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                Download Now <ArrowRight className="ml-2" />
              </Link>
              <Link href="/about" className="inline-flex items-center justify-center h-12 px-8 text-lg font-medium border border-input bg-background rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                Xem Thêm
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why Choose Us?
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              We provide the best experience with cutting-edge technology 
              and customer-first approach.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center">
                  <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {reviews.length > 0 && (
        <section className="bg-muted/30 py-24 sm:py-32">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                What Our Customers Say
              </h2>
              <p className="mt-6 text-lg text-muted-foreground">
                Don't just take our word for it. Here's what our customers have to say about us.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-5xl">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardHeader>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.max(1, Math.min(5, review.rating || 5)) }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <blockquote className="text-sm text-muted-foreground">
                        "{review.content}"
                      </blockquote>
                      <div className="mt-4">
                        <cite className="text-sm font-semibold not-italic">
                          {review.user?.name || review.guestName || 'Anonymous'}
                        </cite>
                        <p className="text-xs text-muted-foreground">
                          {review.product?.title || 'Customer'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      
    </>
  )
}

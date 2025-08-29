import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { getSEOSettings } from '@/lib/dynamic-seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const settings = await getSEOSettings()
    
    // If sitemap is disabled, return empty sitemap
    if (!settings.sitemapEnabled) {
      return []
    }
    
    const baseUrl = settings.siteUrl // Already handles fallback logic in getSEOSettings()
    // Static pages
    const staticPages = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1.0,
      },
      {
        url: `${baseUrl}/products`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/categories`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      },
      {
        url: `${baseUrl}/contact`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      },
    ]

    // Dynamic product pages
    const products = await prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    })

    const productPages = products.map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // Dynamic category pages
    const categories = await prisma.category.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    })

    const categoryPages = categories.map((category) => ({
      url: `${baseUrl}/categories/${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    // Dynamic blog pages
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    })

    const blogPages = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }))

    return [...staticPages, ...productPages, ...categoryPages, ...blogPages]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    
    // Return basic sitemap if database query fails
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
    ]
  }
}


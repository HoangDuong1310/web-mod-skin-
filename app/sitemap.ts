import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { getSEOSettings } from '@/lib/dynamic-seo'
import { DEFAULT_CONFIG } from '@/lib/default-config'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const settings = await getSEOSettings()

    // If sitemap is disabled, return empty sitemap
    if (!settings.sitemapEnabled) {
      return []
    }

    const baseUrl = (settings.siteUrl || DEFAULT_CONFIG.siteUrl).replace(
      /\/$/,
      ''
    )
    // Static pages — chỉ liệt kê các trang công khai, có nội dung thật,
    // mong muốn xuất hiện trên Google. Auth/checkout/cart/maintenance KHÔNG vào sitemap.
    const staticPages = [
      {
        url: baseUrl,
        changeFrequency: 'daily' as const,
        priority: 1.0,
      },
      {
        url: `${baseUrl}/products`,
        changeFrequency: 'daily' as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/custom-skins`,
        changeFrequency: 'daily' as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/categories`,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/blog`,
        changeFrequency: 'daily' as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/about`,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      },
      {
        url: `${baseUrl}/contact`,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      },
      {
        url: `${baseUrl}/donate`,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
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

    // Dynamic custom-skins detail pages — đây là trang công khai có giá trị SEO,
    // hiện đang nằm ngoài sitemap nên Google chỉ "Discovered/Crawled - not indexed".
    let customSkinPages: Array<{
      url: string
      lastModified: Date
      changeFrequency: 'weekly'
      priority: number
    }> = []

    try {
      const customSkins = await prisma.customSkin.findMany({
        where: {
          status: { in: ['APPROVED', 'FEATURED'] },
          deletedAt: null,
        },
        select: {
          id: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 5000, // hard cap để sitemap không vượt 50k URL
      })

      customSkinPages = customSkins.map((skin) => ({
        url: `${baseUrl}/custom-skins/${skin.id}`,
        lastModified: skin.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    } catch (skinError) {
      console.warn('Custom skins table not available for sitemap:', skinError)
    }

    // Dynamic blog pages - safely handle if post table doesn't exist
    let blogPages: Array<{
      url: string
      lastModified: Date
      changeFrequency: 'monthly'
      priority: number
    }> = []

    try {
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

      blogPages = posts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      }))
    } catch (postError) {
      console.warn('Posts table not available for sitemap:', postError)
      // Continue without blog pages
    }

    return [
      ...staticPages,
      ...productPages,
      ...categoryPages,
      ...customSkinPages,
      ...blogPages,
    ]
  } catch (error) {
    console.error('Error generating sitemap:', error)

    // Return basic sitemap if database query fails
    const baseUrl = DEFAULT_CONFIG.siteUrl
    return [
      {
        url: baseUrl,
        changeFrequency: 'daily',
        priority: 1.0,
      },
    ]
  }
}

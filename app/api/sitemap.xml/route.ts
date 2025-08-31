import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSEOSettings } from '@/lib/dynamic-seo'

export async function GET() {
  try {
    const settings = await getSEOSettings()
    
    // If sitemap is disabled, return 404
    if (!settings.sitemapEnabled) {
      return new NextResponse('Sitemap disabled', { status: 404 })
    }
    
    const baseUrl = settings.siteUrl || 'https://example.com'
    
    // Static pages
    const staticPages = [
      { url: baseUrl, lastmod: new Date().toISOString(), priority: '1.0' },
      { url: `${baseUrl}/products`, lastmod: new Date().toISOString(), priority: '0.9' },
      { url: `${baseUrl}/categories`, lastmod: new Date().toISOString(), priority: '0.8' },
      { url: `${baseUrl}/blog`, lastmod: new Date().toISOString(), priority: '0.8' },
      { url: `${baseUrl}/about`, lastmod: new Date().toISOString(), priority: '0.6' },
      { url: `${baseUrl}/contact`, lastmod: new Date().toISOString(), priority: '0.6' },
    ]

    // Dynamic product pages
    let productPages: Array<{ url: string; lastmod: string; priority: string }> = []
    try {
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

      productPages = products.map((product) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastmod: product.updatedAt.toISOString(),
        priority: '0.7',
      }))
    } catch (error) {
      console.warn('Could not load products for sitemap:', error)
    }

    // Dynamic category pages
    let categoryPages: Array<{ url: string; lastmod: string; priority: string }> = []
    try {
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

      categoryPages = categories.map((category) => ({
        url: `${baseUrl}/categories/${category.slug}`,
        lastmod: category.updatedAt.toISOString(),
        priority: '0.6',
      }))
    } catch (error) {
      console.warn('Could not load categories for sitemap:', error)
    }

    const allPages = [...staticPages, ...productPages, ...categoryPages]

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map((page) => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error generating sitemap API:', error)
    
    // Return basic sitemap
    const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>`
    
    return new NextResponse(basicSitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    })
  }
}
import { NextResponse } from 'next/server'
import { getSEOSettings } from '@/lib/dynamic-seo'

export async function GET() {
  try {
    const settings = await getSEOSettings()
    const baseUrl = settings.siteUrl || 'https://example.com'

    // If robots is disabled, return minimal robots.txt
    if (!settings.robotsEnabled) {
      const robotsContent = `User-agent: *
Disallow: /`

      return new NextResponse(robotsContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      })
    }

    // If SEO indexing is disabled, block all crawlers
    if (!settings.seoIndexing) {
      const robotsContent = `User-agent: *
Disallow: /

${settings.sitemapEnabled ? `Sitemap: ${baseUrl}/sitemap.xml` : ''}`

      return new NextResponse(robotsContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      })
    }

    // Default robots.txt content
    const robotsContent = `User-agent: *
Allow: /
Allow: /products
Allow: /categories
Allow: /blog
Allow: /about
Allow: /contact
Disallow: /admin
Disallow: /app
Disallow: /api
Disallow: /auth
Disallow: /_next
Disallow: /private
Disallow: *.json
Disallow: *?*utm_*
Disallow: *?*fbclid*
Disallow: *?*gclid*
Crawl-delay: 1

User-agent: Googlebot
Allow: /
Allow: /products
Allow: /categories
Allow: /blog
Allow: /about
Allow: /contact
Disallow: /admin
Disallow: /app
Disallow: /api
Disallow: /auth
Disallow: /_next
Disallow: /private

${settings.sitemapEnabled ? `Sitemap: ${baseUrl}/sitemap.xml` : ''}
Host: ${baseUrl}`

    return new NextResponse(robotsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error generating robots.txt API:', error)
    
    // Return safe default robots.txt
    const defaultRobots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /app
Disallow: /api

Host: https://example.com`
    
    return new NextResponse(defaultRobots, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }
}
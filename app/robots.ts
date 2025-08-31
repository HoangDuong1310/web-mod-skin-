import type { MetadataRoute } from 'next'
import { getSEOSettings } from '@/lib/dynamic-seo'

export default async function robots(): Promise<MetadataRoute.Robots> {
  try {
    const settings = await getSEOSettings()
    const baseUrl = settings.siteUrl // Already handles fallback logic in getSEOSettings()

    // If robots is disabled, return minimal robots.txt
    if (!settings.robotsEnabled) {
      return {
        rules: [
          {
            userAgent: '*',
            disallow: '/',
          },
        ],
        host: baseUrl,
      }
    }

    // If SEO indexing is disabled, block all crawlers
    if (!settings.seoIndexing) {
      return {
        rules: [
          {
            userAgent: '*',
            disallow: '/',
          },
        ],
        sitemap: settings.sitemapEnabled ? `${baseUrl}/sitemap.xml` : undefined,
        host: baseUrl,
      }
    }

  // Default robots.txt
  const rules: MetadataRoute.Robots['rules'] = [
    {
      userAgent: '*',
      allow: [
        '/',
        '/products',
        '/categories',
        '/blog',
        '/about',
        '/contact',
      ],
      disallow: [
        '/admin',
        '/app',
        '/api',
        '/auth',
        '/_next',
        '/private',
        '*.json',
        '*?*utm_*',
        '*?*fbclid*',
        '*?*gclid*',
      ],
      crawlDelay: 1,
    },
    {
      userAgent: 'Googlebot',
      allow: [
        '/',
        '/products',
        '/categories',
        '/blog',
        '/about',
        '/contact',
      ],
      disallow: [
        '/admin',
        '/app',
        '/api',
        '/auth',
        '/_next',
        '/private',
      ],
    },
  ]

    return {
      rules,
      sitemap: settings.sitemapEnabled ? `${baseUrl}/sitemap.xml` : undefined,
      host: baseUrl,
    }
  } catch (error) {
    console.error('Error generating robots.txt:', error)
    
    // Return safe default robots.txt
    return {
      rules: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/admin', '/app', '/api'],
        },
      ],
      host: 'https://example.com',
    }
  }
}


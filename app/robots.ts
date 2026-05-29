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
  //
  // Notes:
  // - Everything is crawlable by default (`allow: '/'`). We only block paths
  //   that are private/auth-gated or non-content (admin, api, auth, account).
  // - We do NOT block URLs with tracking params (utm/fbclid/gclid). Blocking
  //   them caused "Indexed, though blocked by robots.txt" for socially-shared
  //   links (Facebook auto-appends ?fbclid=). Canonical tags (see
  //   lib/dynamic-seo.ts) already consolidate those URLs, which is Google's
  //   recommended approach.
  // - We do NOT block /_next so Googlebot can fetch CSS/JS needed to render.
  // - Sales/pricing pages (/cart, /checkout, /pricing) are intentionally NOT
  //   blocked here. To DROP already-indexed URLs, Google must be able to crawl
  //   them and read either a `noindex` tag (cart) or the redirect to /products
  //   (pricing, checkout). Blocking them in robots.txt would freeze them in the
  //   "Indexed, though blocked" state instead of removing them.
  const rules: MetadataRoute.Robots['rules'] = [
    {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/api',
        '/auth',
        '/dashboard',
        '/profile',
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


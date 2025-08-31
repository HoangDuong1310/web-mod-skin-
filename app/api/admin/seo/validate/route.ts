import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DEFAULT_CONFIG } from '@/lib/default-config'
import { getSEOSettings } from '@/lib/dynamic-seo'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can validate SEO' },
        { status: 403 }
      )
    }

    // Get the correct base URL from SEO settings
    const settings = await getSEOSettings()
    const baseUrl = settings.siteUrl || process.env.APP_URL || (
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}`
        : process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : 'https://yoursite.com'
    )
    
    // Test sitemap generation directly (avoid network issues)
    let sitemapStatus = false
    let robotsStatus = false
    let sitemapError = ''
    let robotsError = ''
    
    // Test sitemap function
    try {
      // Import and test sitemap generation
      const sitemapModule = await import('@/app/sitemap')
      const sitemapData = await sitemapModule.default()
      sitemapStatus = Array.isArray(sitemapData) && sitemapData.length > 0
      if (!sitemapStatus) {
        sitemapError = 'Sitemap returned empty or invalid data'
      }
    } catch (error) {
      sitemapStatus = false
      sitemapError = `Sitemap generation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
    
    // Test robots function
    try {
      // Import and test robots generation
      const robotsModule = await import('@/app/robots')
      const robotsData = await robotsModule.default()
      robotsStatus = robotsData && robotsData.rules && Array.isArray(robotsData.rules) && robotsData.rules.length > 0
      if (!robotsStatus) {
        robotsError = 'Robots returned empty or invalid data'
      }
    } catch (error) {
      robotsStatus = false
      robotsError = `Robots generation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }

    return NextResponse.json({
      sitemap: {
        enabled: sitemapStatus,
        url: `${baseUrl}/sitemap.xml`,
        accessible: sitemapStatus,
        error: sitemapError || null
      },
      robots: {
        enabled: robotsStatus,
        url: `${baseUrl}/robots.txt`,
        accessible: robotsStatus,
        error: robotsError || null
      },
      baseUrl,
      seoSettings: {
        sitemapEnabled: settings.sitemapEnabled,
        robotsEnabled: settings.robotsEnabled,
        seoIndexing: settings.seoIndexing
      },
      timestamp: new Date().toISOString(),
      alternativeRoutes: {
        sitemap: `${baseUrl}/api/sitemap.xml`,
        robots: `${baseUrl}/api/robots.txt`
      }
    })

  } catch (error) {
    console.error('❌ Error validating SEO:', error)
    return NextResponse.json(
      { error: 'Failed to validate SEO settings' },
      { status: 500 }
    )
  }
}

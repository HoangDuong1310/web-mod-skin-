import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DEFAULT_CONFIG } from '@/lib/default-config'

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

    const baseUrl = process.env.APP_URL || (
      process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}`
        : process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : 'https://yoursite.com'
    )
    
    // Check if sitemap is accessible (try both main route and API fallback)
    let sitemapStatus = false
    let robotsStatus = false
    let sitemapError = ''
    let robotsError = ''
    
    // Check sitemap.xml
    try {
      const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`, {
        method: 'GET',
        headers: {
          'User-Agent': 'SEO-Validator/1.0',
        },
      })
      sitemapStatus = sitemapResponse.ok
      if (!sitemapResponse.ok) {
        sitemapError = `HTTP ${sitemapResponse.status}: ${sitemapResponse.statusText}`
      }
    } catch (error) {
      sitemapStatus = false
      sitemapError = `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
    
    // If main sitemap fails, try API route
    if (!sitemapStatus) {
      try {
        const apiSitemapResponse = await fetch(`${baseUrl}/api/sitemap.xml`)
        if (apiSitemapResponse.ok) {
          sitemapStatus = true
          sitemapError = 'Main route failed, but API route works'
        }
      } catch (error) {
        console.warn('API sitemap route also failed:', error)
      }
    }
    
    // Check robots.txt
    try {
      const robotsResponse = await fetch(`${baseUrl}/robots.txt`, {
        method: 'GET',
        headers: {
          'User-Agent': 'SEO-Validator/1.0',
        },
      })
      robotsStatus = robotsResponse.ok
      if (!robotsResponse.ok) {
        robotsError = `HTTP ${robotsResponse.status}: ${robotsResponse.statusText}`
      }
    } catch (error) {
      robotsStatus = false
      robotsError = `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
    
    // If main robots fails, try API route
    if (!robotsStatus) {
      try {
        const apiRobotsResponse = await fetch(`${baseUrl}/api/robots.txt`)
        if (apiRobotsResponse.ok) {
          robotsStatus = true
          robotsError = 'Main route failed, but API route works'
        }
      } catch (error) {
        console.warn('API robots route also failed:', error)
      }
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
      timestamp: new Date().toISOString(),
      fallbackRoutes: {
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

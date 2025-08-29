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
    
    // Check if sitemap is accessible
    let sitemapStatus = false
    let robotsStatus = false
    
    try {
      const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`)
      sitemapStatus = sitemapResponse.ok
    } catch (error) {
      sitemapStatus = false
    }
    
    try {
      const robotsResponse = await fetch(`${baseUrl}/robots.txt`)
      robotsStatus = robotsResponse.ok
    } catch (error) {
      robotsStatus = false
    }

    return NextResponse.json({
      sitemap: {
        enabled: sitemapStatus,
        url: `${baseUrl}/sitemap.xml`,
        accessible: sitemapStatus
      },
      robots: {
        enabled: robotsStatus,
        url: `${baseUrl}/robots.txt`,
        accessible: robotsStatus
      },
      baseUrl,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error validating SEO:', error)
    return NextResponse.json(
      { error: 'Failed to validate SEO settings' },
      { status: 500 }
    )
  }
}

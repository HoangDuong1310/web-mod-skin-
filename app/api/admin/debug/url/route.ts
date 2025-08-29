import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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
        { error: 'Only admins can debug URL' },
        { status: 403 }
      )
    }

    const settings = await getSEOSettings()

    return NextResponse.json({
      message: 'URL Debug Information',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_URL: process.env.VERCEL_URL,
        RAILWAY_PUBLIC_DOMAIN: process.env.RAILWAY_PUBLIC_DOMAIN,
        APP_URL: process.env.APP_URL,
      },
      urls: {
        detectedURL: settings.siteUrl,
        settingsSiteUrl: settings.siteUrl,
        fallbackLogic: {
          step1: 'settings.siteUrl from database',
          step2: 'process.env.APP_URL from environment',
          step3: 'Auto-detect from deploy platform (Vercel/Railway)',
          step4: 'Default fallback based on NODE_ENV'
        }
      },
      currentHost: request.headers.get('host'),
      protocol: request.headers.get('x-forwarded-proto') || 'http',
      fullURL: `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error debugging URL:', error)
    return NextResponse.json(
      { error: 'Failed to debug URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

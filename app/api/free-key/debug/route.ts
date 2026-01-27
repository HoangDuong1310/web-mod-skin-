import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server'
import { getSEOSettings } from '@/lib/dynamic-seo'

export async function GET(request: NextRequest) {
  const settings = await getSEOSettings()
  
  return NextResponse.json({
    debug: 'Free Key URL Sources',
    sources: {
      settingsSiteUrl: settings.siteUrl,
      appUrl: process.env.APP_URL,
      nextauthUrl: process.env.NEXTAUTH_URL,
      vercelUrl: process.env.VERCEL_URL,
      railwayDomain: process.env.RAILWAY_PUBLIC_DOMAIN,
      nodeEnv: process.env.NODE_ENV,
    },
    currentHost: request.headers.get('host'),
    protocol: request.headers.get('x-forwarded-proto') || 'http',
  })
}

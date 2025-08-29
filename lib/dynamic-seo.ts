import { getSettings } from '@/lib/settings'
import type { Metadata } from 'next'

export interface SEOSettings {
  siteName?: string
  siteDescription?: string
  siteUrl?: string
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  ogImage?: string
  twitterCard?: 'summary' | 'summary_large_image'
  googleAnalyticsId?: string
  googleSearchConsoleId?: string
  facebookPixelId?: string
  sitemapEnabled?: boolean
  robotsEnabled?: boolean
  seoIndexing?: boolean
}

export async function getSEOSettings(): Promise<SEOSettings> {
  try {
    const settings = await getSettings('site')
    
    // Determine site URL based on environment
    let siteUrl = settings.siteUrl || process.env.APP_URL
    
    // Only fallback to localhost in development
    if (!siteUrl) {
      if (process.env.NODE_ENV === 'development') {
        siteUrl = 'http://localhost:3000'
      } else {
        // In production, try to detect from environment or throw error
        siteUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` 
             : process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
             : 'https://yoursite.com' // Better than localhost in production
      }
    }
    
    return {
      siteName: settings.siteName || 'Next.js Full-Stack App',
      siteDescription: settings.siteDescription || 'A modern full-stack application',
      siteUrl,
      seoTitle: settings.seoTitle || '',
      seoDescription: settings.seoDescription || '',
      seoKeywords: settings.seoKeywords || '',
      ogImage: settings.ogImage || '',
      twitterCard: settings.twitterCard || 'summary_large_image',
      googleAnalyticsId: settings.googleAnalyticsId || '',
      googleSearchConsoleId: settings.googleSearchConsoleId || '',
      facebookPixelId: settings.facebookPixelId || '',
      sitemapEnabled: settings.sitemapEnabled ?? true,
      robotsEnabled: settings.robotsEnabled ?? true,
      seoIndexing: settings.seoIndexing ?? true,
    }
  } catch (error) {
    console.error('Failed to load SEO settings:', error)
    return {
      siteName: 'Next.js Full-Stack App',
      siteDescription: 'A modern full-stack application',
      siteUrl: process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}`
        : process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : 'https://yoursite.com',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      ogImage: '',
      twitterCard: 'summary_large_image',
      googleAnalyticsId: '',
      googleSearchConsoleId: '',
      facebookPixelId: '',
      sitemapEnabled: true,
      robotsEnabled: true,
      seoIndexing: true,
    }
  }
}

export async function generateDynamicMetadata(
  pageConfig: {
    title?: string
    description?: string
    keywords?: string[]
    image?: string
    url?: string
    type?: 'website' | 'article' | 'product'
  } = {}
): Promise<Metadata> {
  const settings = await getSEOSettings()
  
  const title = pageConfig.title || settings.seoTitle || settings.siteName
  const description = pageConfig.description || settings.seoDescription || settings.siteDescription
  const keywords = pageConfig.keywords || (settings.seoKeywords ? settings.seoKeywords.split(',').map(k => k.trim()) : [])
  const image = pageConfig.image || settings.ogImage
  const url = pageConfig.url || ''
  const type = pageConfig.type || 'website'
  
  const fullTitle = title && title !== settings.siteName ? `${title} | ${settings.siteName}` : settings.siteName
  const fullUrl = url ? `${settings.siteUrl}${url}` : settings.siteUrl
  const imageUrl = image ? (image.startsWith('http') ? image : `${settings.siteUrl}${image}`) : null

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: settings.siteName }],
    creator: settings.siteName,
    publisher: settings.siteName,
    robots: settings.seoIndexing ? {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    } : {
      index: false,
      follow: false,
    },
    openGraph: {
      type: type as any,
      locale: 'en_US',
      url: fullUrl,
      title: fullTitle,
      description,
      siteName: settings.siteName,
      images: imageUrl ? [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title || settings.siteName,
        },
      ] : [],
    },
    twitter: {
      card: settings.twitterCard,
      title: fullTitle,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: fullUrl,
    },
    other: {
      ...(settings.googleSearchConsoleId && { 
        'google-site-verification': settings.googleSearchConsoleId.replace('google-site-verification=', '') 
      }),
    },
  }
}

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { getSettings, saveSettings } from '@/lib/settings'
import { DEFAULT_CONFIG } from '@/lib/default-config'

const siteSettingsSchema = z.object({
  siteName: z.union([z.string(), z.null()]).optional(),
  siteDescription: z.union([z.string(), z.null()]).optional(),
  siteUrl: z.union([z.string(), z.null()]).optional().refine((val) => !val || val === null || z.string().url().safeParse(val).success, {
    message: "Invalid URL"
  }),
  siteLogo: z.union([z.string(), z.null()]).optional().refine((val) => !val || val === null || z.string().url().safeParse(val).success, {
    message: "Invalid logo URL"
  }),
  favicon: z.union([z.string(), z.null()]).optional().refine((val) => !val || val === null || z.string().url().safeParse(val).success, {
    message: "Invalid favicon URL"  
  }),
  language: z.string().default('en'),
  timezone: z.string().default('UTC'),
  maintenanceMode: z.boolean().default(false),
  allowRegistration: z.boolean().default(true),
  requireEmailVerification: z.boolean().default(false),
  defaultUserRole: z.enum(['USER', 'STAFF']).default('USER'),
  contactEmail: z.union([z.string(), z.null()]).optional().refine((val) => !val || val === null || z.string().email().safeParse(val).success, {
    message: "Invalid contact email"
  }),
  supportEmail: z.union([z.string(), z.null()]).optional().refine((val) => !val || val === null || z.string().email().safeParse(val).success, {
    message: "Invalid support email"
  }),
  socialLinks: z.object({
    twitter: z.string().optional(),
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    linkedin: z.string().optional(),
  }).optional(),
  // SEO Settings
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  ogImage: z.union([z.string(), z.null()]).optional().refine((val) => !val || val === null || z.string().url().safeParse(val).success, {
    message: "Invalid Open Graph image URL"
  }),
  twitterCard: z.enum(['summary', 'summary_large_image']).default('summary_large_image'),
  googleAnalyticsId: z.string().optional(),
  googleSearchConsoleId: z.string().optional(),
  facebookPixelId: z.string().optional(),
  // Sitemap Settings
  sitemapEnabled: z.boolean().default(true),
  robotsEnabled: z.boolean().default(true),
  seoIndexing: z.boolean().default(true),
  // Download Settings
  downloadDelayEnabled: z.boolean().default(true),
  downloadDelaySeconds: z.number().min(5).max(120).default(30),
})



export async function POST(request: NextRequest) {
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
        { error: 'Only admins can modify site settings' },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('🔵 Received site settings:', body)

    const validation = siteSettingsSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid settings data',
          details: validation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      )
    }

    // Save to database
    await saveSettings('site', validation.data)

    return NextResponse.json({
      message: 'Site settings saved successfully',
      settings: validation.data,
    })

  } catch (error) {
    console.error('❌ Error saving site settings:', error)
    return NextResponse.json(
      { error: 'Failed to save site settings' },
      { status: 500 }
    )
  }
}

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
        { error: 'Only admins can view site settings' },
        { status: 403 }
      )
    }

    // Load from database
    const savedSettings = await getSettings('site')
    
    const defaultSettings = {
      siteName: DEFAULT_CONFIG.siteName,
      siteDescription: DEFAULT_CONFIG.siteDescription,
      siteUrl: DEFAULT_CONFIG.siteUrl,
      siteLogo: '',
      favicon: '',
      language: 'en',
      timezone: 'UTC',
      maintenanceMode: false,
      allowRegistration: true,
      requireEmailVerification: false,
      defaultUserRole: 'USER',
      contactEmail: DEFAULT_CONFIG.contactEmail,
      supportEmail: DEFAULT_CONFIG.supportEmail,
      socialLinks: {
        twitter: '',
        facebook: '',
        instagram: '',
        linkedin: '',
      },
      // SEO Settings
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      ogImage: '',
      twitterCard: 'summary_large_image',
      googleAnalyticsId: '',
      googleSearchConsoleId: '',
      facebookPixelId: '',
      // Sitemap Settings
      sitemapEnabled: true,
      robotsEnabled: true,
      seoIndexing: true,
      // Download Settings
      downloadDelayEnabled: true,
      downloadDelaySeconds: 30,
    }

    return NextResponse.json({
      settings: { ...defaultSettings, ...savedSettings },
    })

  } catch (error) {
    console.error('Error fetching site settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch site settings' },
      { status: 500 }
    )
  }
}
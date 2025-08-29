import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { getSettings, saveSettings } from '@/lib/settings'

const systemSettingsSchema = z.object({
  // Database Settings
  enableBackups: z.boolean().default(true),
  backupFrequency: z.enum(['hourly', 'daily', 'weekly', 'monthly']).default('daily'),
  retentionDays: z.number().min(7).max(365).default(30),
  
  // Performance
  enableCaching: z.boolean().default(true),
  cacheTimeout: z.number().min(60).max(86400).default(3600),
  enableCompression: z.boolean().default(true),
  
  // Storage
  maxFileSize: z.number().min(1).max(500).default(50),
  allowedFileTypes: z.string().optional().or(z.literal('')).default('zip,rar,exe,msi,dmg,pkg'),
  storageCleanupEnabled: z.boolean().default(true),
  
  // Logging
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  enableErrorReporting: z.boolean().default(true),
  enablePerformanceMonitoring: z.boolean().default(false),
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
        { error: 'Only admins can modify system settings' },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('🔵 Received system settings:', body)

    const validation = systemSettingsSchema.safeParse(body)
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
    await saveSettings('system', validation.data)

    return NextResponse.json({
      message: 'System settings saved successfully',
    })

  } catch (error) {
    console.error('❌ Error saving system settings:', error)
    return NextResponse.json(
      { error: 'Failed to save system settings' },
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
        { error: 'Only admins can view system settings' },
        { status: 403 }
      )
    }

    // Load from database
    const savedSettings = await getSettings('system')
    
    const defaultSettings = {
      enableBackups: true,
      backupFrequency: 'daily',
      retentionDays: 30,
      enableCaching: true,
      cacheTimeout: 3600,
      enableCompression: true,
      maxFileSize: 50,
      allowedFileTypes: 'zip,rar,exe,msi,dmg,pkg',
      storageCleanupEnabled: true,
      logLevel: 'info',
      enableErrorReporting: true,
      enablePerformanceMonitoring: false,
    }

    return NextResponse.json({
      settings: { ...defaultSettings, ...savedSettings },
    })

  } catch (error) {
    console.error('Error fetching system settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 }
    )
  }
}

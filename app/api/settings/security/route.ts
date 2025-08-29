import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { getSettings, saveSettings } from '@/lib/settings'

const securitySettingsSchema = z.object({
  // Password Policies
  minPasswordLength: z.number().min(6).max(20).default(8),
  requireUppercase: z.boolean().default(true),
  requireNumbers: z.boolean().default(true),
  requireSpecialChars: z.boolean().default(false),
  passwordHistoryCount: z.number().min(0).max(10).default(3),
  maxPasswordAge: z.number().min(0).max(365).default(90),
  
  // Session Settings
  sessionTimeout: z.number().min(1).max(168).default(24),
  maxConcurrentSessions: z.number().min(1).max(20).default(5),
  requireTwoFactor: z.boolean().default(false),
  
  // Account Security
  maxLoginAttempts: z.number().min(3).max(10).default(5),
  lockoutDuration: z.number().min(5).max(60).default(15),
  enableCaptcha: z.boolean().default(false),
  
  // Admin Security
  adminIpWhitelist: z.string().optional().or(z.literal('')),
  enableAuditLog: z.boolean().default(true),
  requireAdminApproval: z.boolean().default(false),
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
        { error: 'Only admins can modify security settings' },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('🔵 Received security settings:', body)

    const validation = securitySettingsSchema.safeParse(body)
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
    await saveSettings('security', validation.data)

    return NextResponse.json({
      message: 'Security settings saved successfully',
    })

  } catch (error) {
    console.error('❌ Error saving security settings:', error)
    return NextResponse.json(
      { error: 'Failed to save security settings' },
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
        { error: 'Only admins can view security settings' },
        { status: 403 }
      )
    }

    // Load from database
    const savedSettings = await getSettings('security')
    
    const defaultSettings = {
      minPasswordLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      passwordHistoryCount: 3,
      maxPasswordAge: 90,
      sessionTimeout: 24,
      maxConcurrentSessions: 5,
      requireTwoFactor: false,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      enableCaptcha: false,
      adminIpWhitelist: '',
      enableAuditLog: true,
      requireAdminApproval: false,
    }

    return NextResponse.json({
      settings: { ...defaultSettings, ...savedSettings },
    })

  } catch (error) {
    console.error('Error fetching security settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch security settings' },
      { status: 500 }
    )
  }
}

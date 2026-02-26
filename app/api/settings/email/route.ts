import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { getSettings, saveSettings } from '@/lib/settings'
import { DEFAULT_CONFIG } from '@/lib/default-config'
import { emailService } from '@/lib/email'

const emailSettingsSchema = z.object({
  smtpEnabled: z.boolean().default(false),
  smtpHost: z.string().optional().or(z.literal('')),
  smtpPort: z.number().min(1).max(65535).optional(),
  smtpUsername: z.string().optional().or(z.literal('')),
  smtpPassword: z.string().optional().or(z.literal('')),
  smtpSecure: z.boolean().default(true),
  fromName: z.string().optional().or(z.literal('')),
  fromEmail: z.union([z.string(), z.null()]).optional().refine((val) => !val || val === null || z.string().email().safeParse(val).success, {
    message: "Invalid from email"
  }),
  replyToEmail: z.union([z.string(), z.null()]).optional().refine((val) => !val || val === null || z.string().email().safeParse(val).success, {
    message: "Invalid reply-to email"
  }),
  adminEmail: z.union([z.string(), z.null()]).optional().refine((val) => !val || val === null || z.string().email().safeParse(val).success, {
    message: "Invalid admin email"
  }),
  
  // Email notifications
  welcomeEmailEnabled: z.boolean().default(true),
  passwordResetEnabled: z.boolean().default(true),
  passwordChangedEnabled: z.boolean().default(true),
  reviewNotificationEnabled: z.boolean().default(true),
  orderConfirmationEnabled: z.boolean().default(true),
  paymentSuccessEnabled: z.boolean().default(true),
  orderCancellationEnabled: z.boolean().default(true),
  licenseNotificationEnabled: z.boolean().default(true),
  contactFormEnabled: z.boolean().default(true),
  downloadNotificationEnabled: z.boolean().default(false),
  adminNotificationEnabled: z.boolean().default(true),
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
        { error: 'Only admins can modify email settings' },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('🔵 Received email settings:', { ...body, smtpPassword: '[HIDDEN]' })

    const validation = emailSettingsSchema.safeParse(body)
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
    await saveSettings('email', validation.data)

    // Reset cached transporter so next email uses new settings
    emailService.resetTransporter()

    return NextResponse.json({
      message: 'Email settings saved successfully',
    })

  } catch (error) {
    console.error('❌ Error saving email settings:', error)
    return NextResponse.json(
      { error: 'Failed to save email settings' },
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
        { error: 'Only admins can view email settings' },
        { status: 403 }
      )
    }

    // Load from database
    const savedSettings = await getSettings('email')
    
    const defaultSettings = {
      smtpEnabled: false,
      smtpHost: '',
      smtpPort: 587,
      smtpUsername: '',
      smtpPassword: '',
      smtpSecure: true,
      fromName: DEFAULT_CONFIG.fromName,
      fromEmail: '',
      replyToEmail: '',
      welcomeEmailEnabled: true,
      passwordResetEnabled: true,
      reviewNotificationEnabled: true,
      downloadNotificationEnabled: false,
      adminNotificationEnabled: true,
    }

    return NextResponse.json({
      settings: { ...defaultSettings, ...savedSettings },
    })

  } catch (error) {
    console.error('Error fetching email settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email settings' },
      { status: 500 }
    )
  }
}

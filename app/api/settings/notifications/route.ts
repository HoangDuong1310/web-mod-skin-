import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { getSettings, saveSettings } from '@/lib/settings'

const notificationSettingsSchema = z.object({
  // Admin Notifications
  newUserNotification: z.boolean().default(true),
  newProductNotification: z.boolean().default(true),
  newReviewNotification: z.boolean().default(true),
  systemErrorNotification: z.boolean().default(true),
  backupNotification: z.boolean().default(true),
  
  // User Notifications
  welcomeEmailEnabled: z.boolean().default(true),
  downloadConfirmationEnabled: z.boolean().default(false),
  reviewApprovalNotification: z.boolean().default(true),
  passwordChangeNotification: z.boolean().default(true),
  securityAlertNotification: z.boolean().default(true),
  
  // Notification Channels
  emailNotifications: z.boolean().default(true),
  browserNotifications: z.boolean().default(false),
  slackNotifications: z.boolean().default(false),
  
  // Notification Settings
  notificationFrequency: z.enum(['immediate', 'hourly', 'daily', 'weekly']).default('immediate'),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).default('22:00'),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).default('08:00'),
  enableQuietHours: z.boolean().default(true),
  
  // Integration Settings
  slackWebhookUrl: z.string().url().optional().or(z.literal('')),
  discordWebhookUrl: z.string().url().optional().or(z.literal('')),
  telegramBotToken: z.string().optional().or(z.literal('')),
  telegramChatId: z.string().optional().or(z.literal('')),
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
        { error: 'Only admins can modify notification settings' },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('🔵 Received notification settings:', { 
      ...body, 
      telegramBotToken: body.telegramBotToken ? '[HIDDEN]' : '' 
    })

    const validation = notificationSettingsSchema.safeParse(body)
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
    await saveSettings('notifications', validation.data)

    return NextResponse.json({
      message: 'Notification settings saved successfully',
    })

  } catch (error) {
    console.error('❌ Error saving notification settings:', error)
    return NextResponse.json(
      { error: 'Failed to save notification settings' },
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
        { error: 'Only admins can view notification settings' },
        { status: 403 }
      )
    }

    // Load from database  
    const savedSettings = await getSettings('notifications')
    
    const defaultSettings = {
      newUserNotification: true,
      newProductNotification: true,
      newReviewNotification: true,
      systemErrorNotification: true,
      backupNotification: true,
      welcomeEmailEnabled: true,
      downloadConfirmationEnabled: false,
      reviewApprovalNotification: true,
      passwordChangeNotification: true,
      securityAlertNotification: true,
      emailNotifications: true,
      browserNotifications: false,
      slackNotifications: false,
      notificationFrequency: 'immediate',
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      enableQuietHours: true,
      slackWebhookUrl: '',
      discordWebhookUrl: '',
      telegramBotToken: '',
      telegramChatId: '',
    }

    return NextResponse.json({
      settings: { ...defaultSettings, ...savedSettings },
    })

  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    )
  }
}

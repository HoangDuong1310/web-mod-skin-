import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notificationService } from '@/lib/notifications'

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
        { error: 'Only admins can test notifications' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { channel } = body

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel parameter is required' },
        { status: 400 }
      )
    }

    console.log('🔵 Testing notification channel:', channel)

    // Validate channel
    const validChannels = ['email', 'browser', 'slack', 'discord', 'telegram']
    if (!validChannels.includes(channel)) {
      return NextResponse.json(
        { error: 'Invalid notification channel' },
        { status: 400 }
      )
    }

    // Send actual test notification
    const success = await notificationService.sendTestNotification(channel)

    if (!success) {
      return NextResponse.json(
        { error: `Failed to send test ${channel} notification. Please check your configuration.` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Test ${channel} notification sent successfully`,
      channel,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('❌ Error testing notification:', error)
    return NextResponse.json(
      { error: 'Failed to test notification' },
      { status: 500 }
    )
  }
}


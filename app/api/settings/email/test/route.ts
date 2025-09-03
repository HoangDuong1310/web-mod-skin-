import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { emailService } from '@/lib/email'

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
        { error: 'Only admins can send test emails' },
        { status: 403 }
      )
    }

    if (!session.user.email) {
      return NextResponse.json(
        { error: 'Admin email not found' },
        { status: 400 }
      )
    }

    console.log('📧 Sending test email to:', session.user.email)

    // Send actual test email using the email service
    const success = await emailService.sendTestEmail(session.user.email)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to send test email. Please check your SMTP configuration.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Test email sent successfully',
      recipient: session.user.email,
    })

  } catch (error) {
    console.error('❌ Error sending test email:', error)
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}

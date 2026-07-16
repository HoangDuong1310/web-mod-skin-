import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { emailService } from '@/lib/email'
import { strictLimiter } from '@/lib/rate-limit'

const contactSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(100),
  email: z.string().email('Email không hợp lệ'),
  subject: z.string().min(3, 'Tiêu đề phải có ít nhất 3 ký tự').max(200),
  type: z.enum(['support', 'bug', 'feature', 'business']).default('support'),
  message: z.string().min(10, 'Nội dung phải có ít nhất 10 ký tự').max(5000),
})

export async function POST(request: NextRequest) {
  // Rate limit: max 10 contact submissions per minute per IP.
  const rl = await strictLimiter(request)
  if (!rl.success) {
    return NextResponse.json(
      {
        error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
        retryAfter: Math.ceil((rl.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rl.resetTime - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  try {
    const body = await request.json()
    const data = contactSchema.parse(body)

    // Send email to admin
    const adminEmailSent = await emailService.sendContactFormEmail(
      data.name,
      data.email,
      data.subject,
      data.type,
      data.message
    )

    // Send auto-reply to sender
    emailService.sendContactAutoReply(data.email, data.name, data.subject).catch(err =>
      console.error('❌ Failed to send contact auto-reply:', err)
    )

    if (!adminEmailSent) {
      // Even if email fails, we should at least acknowledge receipt
      console.error('❌ Failed to send contact form email to admin')
    }

    return NextResponse.json({
      message: 'Tin nhắn đã được gửi thành công! Chúng tôi sẽ phản hồi sớm nhất có thể.',
    })
  } catch (error) {
    console.error('Contact form error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Đã xảy ra lỗi, vui lòng thử lại sau.' },
      { status: 500 }
    )
  }
}

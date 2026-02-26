import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emailService } from '@/lib/email'
import { z } from 'zod'
import crypto from 'crypto'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Always return success (don't reveal if email exists)
    const successResponse = NextResponse.json({
      message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.',
    })

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, name: true },
    })

    if (!user) {
      // Don't reveal that user doesn't exist
      return successResponse
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store token using VerificationToken model
    // Delete any existing tokens for this user first
    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email },
    })

    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: hashedToken,
        expires,
      },
    })

    // Get base URL
    const baseUrl = request.headers.get('origin') ||
      request.headers.get('x-forwarded-host') ?
        `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('x-forwarded-host')}` :
        process.env.NEXTAUTH_URL || 'http://localhost:3000'

    // Send reset email (use raw token, not hashed)
    await emailService.sendPasswordResetEmail(user.email, resetToken, baseUrl)

    return successResponse
  } catch (error) {
    console.error('Forgot password error:', error)

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

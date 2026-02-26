import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import crypto from 'crypto'
import { emailService } from '@/lib/email'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token là bắt buộc'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    // Find verification token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token: hashedToken,
        expires: { gt: new Date() },
      },
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.' },
        { status: 400 }
      )
    }

    // Find user by identifier (email)
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy tài khoản.' },
        { status: 404 }
      )
    }

    // Hash new password and update
    const hashedPassword = await hash(password, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordUpdatedAt: new Date(),
      },
    })

    // Delete the used token
    await prisma.verificationToken.deleteMany({
      where: { identifier: verificationToken.identifier },
    })

    // Send confirmation email
    emailService.sendPasswordChangedEmail(
      user.email!,
      user.name || 'Bạn',
      false
    ).catch(err => console.error('❌ Failed to send password changed email:', err))

    return NextResponse.json({
      message: 'Mật khẩu đã được đặt lại thành công!',
    })
  } catch (error) {
    console.error('Reset password error:', error)

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

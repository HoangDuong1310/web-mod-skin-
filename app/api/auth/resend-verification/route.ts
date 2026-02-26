import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emailService } from '@/lib/email'
import { randomBytes } from 'crypto'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json({
        message: 'If an account exists with this email, a verification link has been sent.',
      })
    }

    // Already verified
    if (user.emailVerified) {
      return NextResponse.json({
        message: 'Email is already verified. You can sign in.',
        alreadyVerified: true,
      })
    }

    // Rate limit: check if a token was created in the last 2 minutes
    const recentToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        expires: { gt: new Date(Date.now() + 23 * 60 * 60 * 1000) }, // Created less than 1h ago (24h expiry - 23h = within last hour)
      },
      orderBy: { expires: 'desc' },
    })

    // Simple rate limit: if token was created within last 60 seconds
    if (recentToken) {
      const tokenCreatedAt = new Date(recentToken.expires.getTime() - 24 * 60 * 60 * 1000)
      const secondsSinceCreation = (Date.now() - tokenCreatedAt.getTime()) / 1000
      if (secondsSinceCreation < 60) {
        return NextResponse.json(
          { error: 'Please wait at least 60 seconds before requesting another verification email.' },
          { status: 429 }
        )
      }
    }

    // Delete old tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    })

    // Generate new token
    const verifyToken = randomBytes(32).toString('hex')
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verifyToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    })

    // Send verification email
    const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000'
    await emailService.sendVerificationEmail(
      email,
      user.name || 'Bạn',
      verifyToken,
      baseUrl.replace(/\/$/, '')
    )

    return NextResponse.json({
      message: 'Verification email sent. Please check your inbox.',
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

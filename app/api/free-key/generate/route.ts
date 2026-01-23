/**
 * Free Key Generation API
 * POST /api/free-key/generate
 * 
 * Generates a YeuMoney shortened URL for the user to bypass ads and get a free key
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { createFreeKeyLink } from '@/lib/yeumoney'
import crypto from 'crypto'

// Rate limiting constants
const MAX_FREE_KEYS_PER_IP_PER_DAY = 3
const MAX_FREE_KEYS_PER_USER_PER_DAY = 5
const SESSION_EXPIRY_MINUTES = 30

export async function POST(request: NextRequest) {
    try {
        const { productId } = await request.json()

        if (!productId) {
            return NextResponse.json(
                { error: 'Product ID is required' },
                { status: 400 }
            )
        }

        // Get client info
        const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            'unknown'
        const userAgent = request.headers.get('user-agent') || undefined

        // Get session (optional - users don't need to be logged in)
        const session = await getServerSession()
        const userId = session?.user?.email
            ? (await prisma.user.findUnique({ where: { email: session.user.email } }))?.id
            : undefined

        // Check product exists and has free key enabled
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                freeKeyPlan: true
            }
        })

        if (!product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            )
        }

        if (!product.requiresKey || !product.freeKeyPlanId) {
            return NextResponse.json(
                { error: 'Free key is not available for this product' },
                { status: 400 }
            )
        }

        // Rate limiting by IP
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const ipSessionCount = await prisma.freeKeySession.count({
            where: {
                ipAddress,
                createdAt: { gte: today },
                status: { in: ['COMPLETED', 'CLAIMED'] }
            }
        })

        if (ipSessionCount >= MAX_FREE_KEYS_PER_IP_PER_DAY) {
            return NextResponse.json(
                { error: `You have reached the daily limit of ${MAX_FREE_KEYS_PER_IP_PER_DAY} free keys. Please try again tomorrow.` },
                { status: 429 }
            )
        }

        // Rate limiting by user (if logged in)
        if (userId) {
            const userSessionCount = await prisma.freeKeySession.count({
                where: {
                    userId,
                    createdAt: { gte: today },
                    status: { in: ['COMPLETED', 'CLAIMED'] }
                }
            })

            if (userSessionCount >= MAX_FREE_KEYS_PER_USER_PER_DAY) {
                return NextResponse.json(
                    { error: `You have reached the daily limit of ${MAX_FREE_KEYS_PER_USER_PER_DAY} free keys. Please try again tomorrow.` },
                    { status: 429 }
                )
            }
        }

        // Generate unique session token
        const token = crypto.randomBytes(32).toString('hex')

        // Calculate session expiry
        const expiresAt = new Date()
        expiresAt.setMinutes(expiresAt.getMinutes() + SESSION_EXPIRY_MINUTES)

        // Create session in database
        const freeKeySession = await prisma.freeKeySession.create({
            data: {
                token,
                productId,
                userId,
                ipAddress,
                userAgent,
                status: 'PENDING',
                expiresAt
            }
        })

        // Get base URL for callback - use a robust method to determine the correct URL
        // Priority: NEXTAUTH_URL > x-forwarded-host > host > request.url
        let baseUrl = process.env.NEXTAUTH_URL

        if (!baseUrl) {
            // Try to get from forwarded headers (for proxy/load balancer setups)
            const forwardedHost = request.headers.get('x-forwarded-host')
            const host = request.headers.get('host')
            const protocol = request.headers.get('x-forwarded-proto') || 'https'

            if (forwardedHost) {
                baseUrl = `${protocol}://${forwardedHost.split(',')[0].trim()}`
            } else if (host) {
                baseUrl = `${protocol}://${host}`
            } else {
                // Last resort: extract from request.url
                try {
                    const url = new URL(request.url)
                    baseUrl = `${url.protocol}//${url.host}`
                } catch {
                    console.error('CRITICAL: Cannot determine baseUrl. NEXTAUTH_URL must be set in production environment')
                    return NextResponse.json(
                        { error: 'Server configuration error: NEXTAUTH_URL not set' },
                        { status: 500 }
                    )
                }
            }
        }

        // Validate that we don't use localhost in production
        if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
            console.error('CRITICAL: baseUrl is using localhost! NEXTAUTH_URL must be set correctly on production server')
            return NextResponse.json(
                { error: 'Server configuration error: NEXTAUTH_URL must be set to production domain' },
                { status: 500 }
            )
        }

        // Create shortened URL
        const result = await createFreeKeyLink(token, baseUrl)

        if (!result.success || !result.shortenedUrl) {
            // Delete the session if we couldn't create the link
            await prisma.freeKeySession.delete({ where: { id: freeKeySession.id } })

            return NextResponse.json(
                { error: 'Failed to generate bypass link. Please try again.' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            shortenedUrl: result.shortenedUrl,
            sessionToken: token,
            expiresAt: expiresAt.toISOString(),
            message: 'Please complete the ad bypass to receive your free key'
        })

    } catch (error) {
        console.error('Free key generation error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

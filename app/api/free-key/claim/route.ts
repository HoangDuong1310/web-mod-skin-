/**
 * Free Key Claim API
 * POST /api/free-key/claim
 * 
 * Claims the free key after user has completed ad bypass
 * SECURITY: Rate limited and validates callback completion
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateKeyString, calculateExpirationDate } from '@/lib/license-key'
import { strictLimiter } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
    // Apply rate limiting - max 10 claims per minute per IP
    const rateLimitResult = await strictLimiter(request)
    
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { 
                error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
                retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
            },
            { status: 429 }
        )
    }

    try {
        const { sessionToken } = await request.json()

        if (!sessionToken) {
            return NextResponse.json(
                { error: 'Session token is required' },
                { status: 400 }
            )
        }

        // Find the session
        const session = await prisma.freeKeySession.findUnique({
            where: { token: sessionToken },
            include: {
                product: {
                    include: {
                        freeKeyPlan: true
                    }
                },
                licenseKey: true
            }
        })

        if (!session) {
            return NextResponse.json(
                { error: 'Invalid session token' },
                { status: 404 }
            )
        }

        // Check if session is expired
        if (new Date() > session.expiresAt) {
            await prisma.freeKeySession.update({
                where: { id: session.id },
                data: { status: 'EXPIRED' }
            })
            return NextResponse.json(
                { error: 'Session has expired. Please try again.' },
                { status: 400 }
            )
        }

        // Check if already claimed
        if (session.status === 'CLAIMED' && session.licenseKey) {
            return NextResponse.json({
                success: true,
                alreadyClaimed: true,
                key: session.licenseKey.key,
                expiresAt: session.licenseKey.expiresAt,
                message: 'You have already claimed this key'
            })
        }

        // Check if not completed yet
        if (session.status === 'PENDING') {
            return NextResponse.json(
                { error: 'Vui lòng hoàn tất vượt quảng cáo trước khi nhận key. Truy cập link rút gọn và xem đủ quảng cáo.' },
                { status: 400 }
            )
        }

        // CRITICAL: Verify that session was completed via valid callback (has callbackSecret consumed)
        // If callbackSecret is null, it means callback was called without proper verification
        if (!session.callbackSecret) {
            console.error(`SECURITY: Session ${sessionToken} claimed without valid callback`)
            return NextResponse.json(
                { error: 'Phiên không hợp lệ. Vui lòng bắt đầu lại từ đầu.' },
                { status: 403 }
            )
        }

        // Check if product has free key plan
        if (!session.product.freeKeyPlan) {
            return NextResponse.json(
                { error: 'Free key plan not configured for this product' },
                { status: 400 }
            )
        }

        // Generate unique license key
        let key = generateKeyString()
        let attempts = 0
        const maxAttempts = 10

        while (attempts < maxAttempts) {
            const existing = await prisma.licenseKey.findUnique({
                where: { key }
            })

            if (!existing) break

            key = generateKeyString()
            attempts++
        }

        if (attempts >= maxAttempts) {
            return NextResponse.json(
                { error: 'Failed to generate unique key. Please try again.' },
                { status: 500 }
            )
        }

        // Calculate expiration using plan's duration settings
        // This ensures: 1 day = 24 hours, 4 hours = 4 hours, etc.
        // Use Date.now() to create UTC timestamp, avoiding server timezone issues
        const now = new Date(Date.now())
        const expiresAt = calculateExpirationDate(
            session.product.freeKeyPlan.durationType,
            session.product.freeKeyPlan.durationValue,
            now
        )

        // Create the license key and update session in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create license key
            const licenseKey = await tx.licenseKey.create({
                data: {
                    key,
                    planId: session.product.freeKeyPlanId!,
                    userId: session.userId,
                    status: 'INACTIVE', // Will be activated on first use
                    maxDevices: session.product.freeKeyPlan.maxDevices || 1,
                    expiresAt,
                    notes: `Free key from ad bypass. Product: ${session.product.title}`,
                    createdBy: 'SYSTEM_FREE_KEY'
                }
            })

            // Update session
            await tx.freeKeySession.update({
                where: { id: session.id },
                data: {
                    status: 'CLAIMED',
                    claimedAt: new Date(),
                    licenseKeyId: licenseKey.id
                }
            })

            return licenseKey
        })

        return NextResponse.json({
            success: true,
            key: result.key,
            expiresAt: result.expiresAt,
            maxDevices: result.maxDevices,
            duration: `${session.product.freeKeyPlan.durationValue} ${session.product.freeKeyPlan.durationType.toLowerCase()}`,
            message: 'Your free key has been generated successfully!'
        })

    } catch (error) {
        console.error('Free key claim error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// GET endpoint to check session status
export async function GET(request: NextRequest) {
    try {
        const token = request.nextUrl.searchParams.get('token')

        if (!token) {
            return NextResponse.json(
                { error: 'Session token is required' },
                { status: 400 }
            )
        }

        const session = await prisma.freeKeySession.findUnique({
            where: { token },
            include: {
                product: {
                    select: {
                        id: true,
                        title: true,
                        slug: true
                    }
                },
                licenseKey: {
                    select: {
                        key: true,
                        expiresAt: true,
                        maxDevices: true
                    }
                }
            }
        })

        if (!session) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            status: session.status,
            product: session.product,
            licenseKey: session.status === 'CLAIMED' ? session.licenseKey : null,
            expiresAt: session.expiresAt,
            isExpired: new Date() > session.expiresAt
        })

    } catch (error) {
        console.error('Free key status check error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

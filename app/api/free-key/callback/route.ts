/**
 * Free Key Callback API
 * GET /api/free-key/callback
 * 
 * Callback endpoint that YeuMoney redirects to after user completes ad bypass
 * CRITICAL: Must verify secret to prevent bypass attacks
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSEOSettings } from '@/lib/dynamic-seo'

// Helper function to get correct base URL
async function getBaseUrl(): Promise<string> {
    const settings = await getSEOSettings()
    return settings.siteUrl || process.env.APP_URL || process.env.NEXTAUTH_URL || 'https://modskinslol.com'
}

export async function GET(request: NextRequest) {
    try {
        const token = request.nextUrl.searchParams.get('token')
        const secret = request.nextUrl.searchParams.get('secret')

        if (!token || !secret) {
            const baseUrl = await getBaseUrl()
            return NextResponse.redirect(new URL('/free-key/error?reason=missing_params', baseUrl))
        }

        // Find the session
        const session = await prisma.freeKeySession.findUnique({
            where: { token },
            include: {
                product: true
            }
        })

        if (!session) {
            const baseUrl = await getBaseUrl()
            return NextResponse.redirect(new URL('/free-key/error?reason=invalid_token', baseUrl))
        }

        // CRITICAL: Verify secret matches
        // This prevents attackers from calling callback directly without viewing ads
        if (session.callbackSecret !== secret) {
            console.error(`SECURITY: Invalid callback secret for session ${token}`)
            const baseUrl = await getBaseUrl()
            return NextResponse.redirect(new URL('/free-key/error?reason=invalid_secret', baseUrl))
        }

        // Check if session is expired
        if (new Date() > session.expiresAt) {
            await prisma.freeKeySession.update({
                where: { id: session.id },
                data: { status: 'EXPIRED' }
            })
            const baseUrl = await getBaseUrl()
            return NextResponse.redirect(new URL('/free-key/error?reason=session_expired', baseUrl))
        }

        const baseUrl = await getBaseUrl()

        // Check if already claimed
        if (session.status === 'CLAIMED') {
            return NextResponse.redirect(new URL(`/free-key/success?token=${token}`, baseUrl))
        }

        // Check if already completed (waiting to be claimed)
        if (session.status === 'COMPLETED') {
            return NextResponse.redirect(new URL(`/free-key/claim?token=${token}`, baseUrl))
        }

        // Mark session as completed
        await prisma.freeKeySession.update({
            where: { id: session.id },
            data: {
                status: 'COMPLETED',
                completedAt: new Date()
            }
        })

        return NextResponse.redirect(new URL(`/free-key/claim?token=${token}`, baseUrl))

    } catch (error) {
        console.error('Free key callback error:', error)
        return NextResponse.redirect(new URL('/free-key/error?reason=server_error', 'https://modskinslol.com'))
    }
}

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
    try {
        const settings = await getSEOSettings()
        const url = settings.siteUrl || process.env.APP_URL || process.env.NEXTAUTH_URL || 'https://modskinslol.com'
        return url.replace(/\/+$/, '')
    } catch (error) {
        console.error('Error getting baseUrl:', error)
        return 'https://modskinslol.com'
    }
}

export async function GET(request: NextRequest) {
    console.log('=== CALLBACK DEBUG ===')
    console.log('Request URL:', request.url)
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))
    
    try {
        const token = request.nextUrl.searchParams.get('token')
        const secret = request.nextUrl.searchParams.get('secret')

        console.log('token:', token?.substring(0, 16) + '...')
        console.log('secret:', secret)

        if (!token || !secret) {
            console.log('Missing token or secret')
            const baseUrl = await getBaseUrl()
            return NextResponse.redirect(new URL('/free-key/error?reason=missing_params', baseUrl))
        }

        // Find the session
        console.log('Looking for session in database...')
        const session = await prisma.freeKeySession.findUnique({
            where: { token },
            include: {
                product: true
            }
        })

        console.log('Session found:', session ? 'YES' : 'NO')
        if (session) {
            console.log('Session status:', session.status)
            console.log('Session callbackSecret:', session.callbackSecret?.substring(0, 8) + '...')
            console.log('Session expiresAt:', session.expiresAt)
        }

        if (!session) {
            console.log('Session not found - invalid token')
            const baseUrl = await getBaseUrl()
            return NextResponse.redirect(new URL('/free-key/error?reason=invalid_token', baseUrl))
        }

        // CRITICAL: Verify secret matches
        console.log('Comparing secrets...')
        console.log('  Provided secret:', secret)
        console.log('  DB callbackSecret:', session.callbackSecret)
        console.log('  Match:', session.callbackSecret === secret)

        if (session.callbackSecret !== secret) {
            console.error('SECURITY: Invalid callback secret for session')
            const baseUrl = await getBaseUrl()
            return NextResponse.redirect(new URL('/free-key/error?reason=invalid_secret', baseUrl))
        }

        // Check if session is expired
        const now = new Date()
        console.log('Current time:', now)
        console.log('Session expiresAt:', session.expiresAt)
        console.log('Is expired:', now > session.expiresAt)

        if (now > session.expiresAt) {
            console.log('Session expired - updating status')
            await prisma.freeKeySession.update({
                where: { id: session.id },
                data: { status: 'EXPIRED' }
            })
            const baseUrl = await getBaseUrl()
            return NextResponse.redirect(new URL('/free-key/error?reason=session_expired', baseUrl))
        }

        const baseUrl = await getBaseUrl()
        console.log('baseUrl:', baseUrl)

        // Check if already claimed
        if (session.status === 'CLAIMED') {
            console.log('Already claimed - redirecting to success')
            return NextResponse.redirect(new URL(`/free-key/success?token=${token}`, baseUrl))
        }

        // Check if already completed (waiting to be claimed)
        if (session.status === 'COMPLETED') {
            console.log('Already completed - redirecting to claim')
            return NextResponse.redirect(new URL(`/free-key/claim?token=${token}`, baseUrl))
        }

        // Mark session as completed
        console.log('Marking session as COMPLETED...')
        await prisma.freeKeySession.update({
            where: { id: session.id },
            data: {
                status: 'COMPLETED',
                completedAt: new Date()
            }
        })

        console.log('Redirecting to /free-key/claim')
        console.log('=== END CALLBACK DEBUG ===')

        return NextResponse.redirect(new URL(`/free-key/claim?token=${token}`, baseUrl))

    } catch (error) {
        console.error('Free key callback error:', error)
        console.error('Error stack:', error instanceof Error ? error.stack : 'unknown')
        console.log('=== END CALLBACK DEBUG (ERROR) ===')
        return NextResponse.redirect(new URL('/free-key/error?reason=server_error', 'https://modskinslol.com'))
    }
}

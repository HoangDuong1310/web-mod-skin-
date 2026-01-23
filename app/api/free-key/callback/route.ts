/**
 * Free Key Callback API
 * GET /api/free-key/callback
 * 
 * Callback endpoint that YeuMoney redirects to after user completes ad bypass
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const token = request.nextUrl.searchParams.get('token')

        if (!token) {
            return NextResponse.redirect(new URL('/free-key/error?reason=missing_token', request.url))
        }

        // Find the session
        const session = await prisma.freeKeySession.findUnique({
            where: { token },
            include: {
                product: true
            }
        })

        if (!session) {
            return NextResponse.redirect(new URL('/free-key/error?reason=invalid_token', request.url))
        }

        // Check if session is expired
        if (new Date() > session.expiresAt) {
            // Update status to expired
            await prisma.freeKeySession.update({
                where: { id: session.id },
                data: { status: 'EXPIRED' }
            })
            return NextResponse.redirect(new URL('/free-key/error?reason=session_expired', request.url))
        }

        // Check if already claimed
        if (session.status === 'CLAIMED') {
            return NextResponse.redirect(new URL(`/free-key/success?token=${token}`, request.url))
        }

        // Check if already completed (waiting to be claimed)
        if (session.status === 'COMPLETED') {
            return NextResponse.redirect(new URL(`/free-key/claim?token=${token}`, request.url))
        }

        // Mark session as completed
        await prisma.freeKeySession.update({
            where: { id: session.id },
            data: {
                status: 'COMPLETED',
                completedAt: new Date()
            }
        })
        let baseUrl: string;
        if (process.env.NEXTAUTH_URL) {
            baseUrl = process.env.NEXTAUTH_URL;
        } else if (request.headers.get('host')) {
            const proto = request.headers.get('x-forwarded-proto') || 'https';
            baseUrl = `${proto}://${request.headers.get('host')}`;
        } else {
            baseUrl = request.url;
        }

        return NextResponse.redirect(new URL(`/free-key/claim?token=${token}`, baseUrl))

    } catch (error) {
        console.error('Free key callback error:', error)
        return NextResponse.redirect(new URL('/free-key/error?reason=server_error', request.url))
    }
}

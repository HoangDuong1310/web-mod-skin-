/**
 * API Route: /api/cron/check-expired-licenses
 * Cron job để tự động cập nhật các license keys đã hết hạn
 * 
 * Có thể gọi bằng:
 * - Vercel Cron (vercel.json)
 * - External cron service (crontab, easycron, etc.)
 * - Manual call với API key
 * 
 * URL: https://your-domain.com/api/cron/check-expired-licenses
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// API Key for manual/cron authentication (optional)
const CRON_API_KEY = process.env.CRON_API_KEY

export async function GET(request: Request) {
  try {
    // Verify API key if configured
    if (CRON_API_KEY) {
      const authHeader = request.headers.get('authorization')
      const apiKey = authHeader?.replace('Bearer ', '')

      if (apiKey !== CRON_API_KEY) {
        return NextResponse.json(
          { error: 'Unauthorized - Invalid API key' },
          { status: 401 }
        )
      }
    }

    const now = new Date(Date.now())

    // Update all ACTIVE keys that have expired
    const updateResult = await prisma.licenseKey.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          lt: now
        }
      },
      data: {
        status: 'EXPIRED'
      }
    })

    // Also update any keys in INACTIVE status that should have expired
    // (e.g., if created with future expiry but never activated)
    const updateInactiveResult = await prisma.licenseKey.updateMany({
      where: {
        status: 'INACTIVE',
        expiresAt: {
          lt: now
        }
      },
      data: {
        status: 'EXPIRED'
      }
    })

    const totalUpdated = updateResult.count + updateInactiveResult.count

    console.log(`[License Cron] ${new Date().toISOString()} - Updated ${totalUpdated} expired keys`)

    return NextResponse.json({
      success: true,
      message: 'Cron job completed',
      data: {
        updatedActiveKeys: updateResult.count,
        updatedInactiveKeys: updateInactiveResult.count,
        totalUpdated,
        timestamp: now.toISOString()
      }
    })
  } catch (error) {
    console.error('License cron error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}

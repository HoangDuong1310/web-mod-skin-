/**
 * API Route: /api/user/licenses
 * Lấy danh sách licenses của user đang đăng nhập
 * Method: GET
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDaysRemaining } from '@/lib/license-key'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const licenses = await prisma.licenseKey.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            durationType: true,
            durationValue: true,
            maxDevices: true,
          },
        },
        activations: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            deviceName: true,
            activatedAt: true,
            lastSeenAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    // Add computed fields
    const licensesWithComputed = licenses.map(license => ({
      ...license,
      daysRemaining: getDaysRemaining(license.expiresAt),
      activeDevicesCount: license.activations.length,
    }))
    
    return NextResponse.json({
      success: true,
      data: licensesWithComputed,
    })
  } catch (error) {
    console.error('Get user licenses error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}

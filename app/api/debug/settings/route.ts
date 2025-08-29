import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can debug settings' },
        { status: 403 }
      )
    }

    // Get all settings from database
    const allSettings = await prisma.setting.findMany({
      orderBy: { key: 'asc' }
    })

    // Get site settings specifically
    const siteSettings = await prisma.setting.findMany({
      where: {
        key: { startsWith: 'site.' }
      }
    })

    return NextResponse.json({
      message: 'Settings debug info',
      totalSettings: allSettings.length,
      siteSettingsCount: siteSettings.length,
      allSettings,
      siteSettings,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error debugging settings:', error)
    return NextResponse.json(
      { error: 'Failed to debug settings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

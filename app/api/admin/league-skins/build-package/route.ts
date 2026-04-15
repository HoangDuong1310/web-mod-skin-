import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { spawn } from 'child_process'
import { existsInR2, getR2PublicUrl } from '@/lib/r2'
import { PACKAGE_KEY } from '@/lib/league-skins-package'

const CATEGORY = 'league-skins'

async function upsertSetting(key: string, value: string) {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value, category: CATEGORY },
  })
}

/**
 * POST - Trigger full package build (runs script in background)
 * Script handles all DB status updates including progress.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = await prisma.setting.findUnique({
      where: { key: 'league_skins_package_status' },
    })

    if (status?.value === 'building') {
      return NextResponse.json(
        { error: 'Package build already in progress' },
        { status: 409 }
      )
    }

    // Set status to building + clear old progress
    await upsertSetting('league_skins_package_status', 'building')
    await upsertSetting('league_skins_package_progress', '')
    await upsertSetting('league_skins_package_error', '')

    // Spawn detached background process with stdio ignored (no buffer limit)
    const child = spawn('npx', ['tsx', 'scripts/build-league-skins-package.ts'], {
      cwd: process.cwd(),
      env: process.env,
      detached: true,
      stdio: 'ignore',
      shell: true,
    })

    child.unref()

    return NextResponse.json({
      success: true,
      message: 'Package build started in background',
    })
  } catch (error) {
    console.error('Error starting package build:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET - Check build status, progress, and package info
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'league_skins_package_status',
            'league_skins_package_built_at',
            'league_skins_package_hash',
            'league_skins_package_size',
            'league_skins_package_files',
            'league_skins_package_error',
            'league_skins_package_progress',
          ],
        },
      },
    })

    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))

    // Parse progress JSON if building
    let progress = null
    if (map.league_skins_package_progress) {
      try {
        progress = JSON.parse(map.league_skins_package_progress)
      } catch {}
    }

    let existsOnR2 = false
    try {
      existsOnR2 = await existsInR2(PACKAGE_KEY)
    } catch {}

    return NextResponse.json({
      status: map.league_skins_package_status || 'none',
      builtAt: map.league_skins_package_built_at || null,
      hash: map.league_skins_package_hash || null,
      size: map.league_skins_package_size || null,
      fileCount: map.league_skins_package_files || null,
      error: map.league_skins_package_error || null,
      progress,
      existsOnR2,
      downloadUrl: existsOnR2 ? getR2PublicUrl(PACKAGE_KEY) : null,
    })
  } catch (error) {
    console.error('Error getting package status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE - Reset/cancel build status (unstick a hung build)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await upsertSetting('league_skins_package_status', 'none')
    await upsertSetting('league_skins_package_progress', '')
    await upsertSetting('league_skins_package_error', '')

    return NextResponse.json({ success: true, message: 'Build status reset' })
  } catch (error) {
    console.error('Error resetting package status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

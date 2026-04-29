import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { spawn } from 'child_process'
import { existsInR2, getR2PublicUrl, uploadToR2 } from '@/lib/r2'
import { PACKAGE_KEY } from '@/lib/league-skins-package'
import { createHash } from 'crypto'
import { generateAndUploadManifest } from '@/lib/league-skins-manifest'

// Allow large file uploads and longer execution time
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for large uploads
export const dynamic = 'force-dynamic'

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
 * PUT - Upload a full package ZIP manually
 * Accepts multipart form data with a 'file' field containing the ZIP.
 * Computes hash, uploads to R2, updates DB settings, and regenerates manifest.
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate it's a zip file
    if (!file.name.endsWith('.zip') && file.type !== 'application/zip') {
      return NextResponse.json({ error: 'File must be a ZIP archive' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const hash = createHash('md5').update(buffer).digest('hex')
    const size = buffer.length

    // Upload to R2
    await uploadToR2(PACKAGE_KEY, buffer, 'application/zip')

    // Count files in zip (approximate from file entries)
    let fileCount = 0
    try {
      // Simple zip file count: count local file headers (PK\x03\x04)
      const PK_HEADER = Buffer.from([0x50, 0x4b, 0x03, 0x04])
      let offset = 0
      while (offset < buffer.length - 4) {
        if (buffer[offset] === 0x50 && buffer[offset + 1] === 0x4b &&
            buffer[offset + 2] === 0x03 && buffer[offset + 3] === 0x04) {
          fileCount++
          offset += 30 // Skip past minimum local file header size
        } else {
          offset++
        }
      }
    } catch {
      // If counting fails, just use 0
    }

    // Format size for display
    const formatBytes = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
    }

    // Update DB settings
    await upsertSetting('league_skins_package_status', 'ready')
    await upsertSetting('league_skins_package_built_at', new Date().toISOString())
    await upsertSetting('league_skins_package_hash', hash.substring(0, 8))
    await upsertSetting('league_skins_package_size', formatBytes(size))
    await upsertSetting('league_skins_package_files', fileCount.toString())
    await upsertSetting('league_skins_package_progress', '')
    await upsertSetting('league_skins_package_error', '')

    // Regenerate manifest with new package hash
    try {
      await generateAndUploadManifest()
    } catch (err) {
      console.error('Manifest generation failed after manual package upload:', err)
    }

    return NextResponse.json({
      success: true,
      message: 'Package uploaded successfully',
      package: {
        key: PACKAGE_KEY,
        hash: hash.substring(0, 8),
        size: formatBytes(size),
        fileCount,
        downloadUrl: getR2PublicUrl(PACKAGE_KEY),
      },
    })
  } catch (error) {
    console.error('Error uploading package:', error)
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

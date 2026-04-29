import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToR2, deleteFromR2, getLeagueSkinR2Key } from '@/lib/r2'
import { createHash } from 'crypto'
import { generateAndUploadManifest } from '@/lib/league-skins-manifest'

// POST - Upload skin file(s)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const skinIdsRaw = formData.get('skinIds') as string // JSON array of skinId numbers
    const championId = formData.get('championId') as string

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Single file upload for a specific skin
    if (files.length === 1 && !skinIdsRaw) {
      const skinId = formData.get('skinId') as string
      if (!skinId) {
        return NextResponse.json({ error: 'skinId is required for single upload' }, { status: 400 })
      }

      const file = files[0]
      const buffer = Buffer.from(await file.arrayBuffer())
      const hash = createHash('md5').update(buffer).digest('hex')
      const skin = await prisma.leagueSkin.findUnique({ where: { skinId: parseInt(skinId) } })

      if (!skin) {
        return NextResponse.json({ error: 'Skin not found in database' }, { status: 404 })
      }

      const r2Key = getLeagueSkinR2Key(skin.championId, parseInt(skinId), skin.parentSkinId)

      // Delete old file if replacing
      if (skin.fileUrl) {
        try { await deleteFromR2(skin.fileUrl) } catch {}
      }

      await uploadToR2(r2Key, buffer, 'application/zip')

      await prisma.leagueSkin.update({
        where: { skinId: parseInt(skinId) },
        data: {
          fileUrl: r2Key,
          fileSize: buffer.length,
          fileHash: hash,
          version: { increment: 1 },
        },
      })

      // Auto-update manifest after upload (updates hash + bumps version)
      try {
        await generateAndUploadManifest()
      } catch (err) {
        console.error('Manifest generation failed after upload:', err)
      }

      return NextResponse.json({ success: true, skinId: parseInt(skinId), r2Key })
    }

    // Bulk upload: files named as {skinId}.zip
    const results: { skinId: number; status: string; error?: string }[] = []
    const skinIds = skinIdsRaw ? JSON.parse(skinIdsRaw) as number[] : []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileName = file.name.replace(/\.zip$/i, '')
      const skinId = skinIds[i] || parseInt(fileName)

      if (isNaN(skinId)) {
        results.push({ skinId: 0, status: 'error', error: `Invalid filename: ${file.name}` })
        continue
      }

      try {
        const skin = await prisma.leagueSkin.findUnique({ where: { skinId } })
        if (!skin) {
          results.push({ skinId, status: 'error', error: 'Skin not found in DB' })
          continue
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const hash = createHash('md5').update(buffer).digest('hex')

        // Skip if hash matches (no change)
        if (skin.fileHash === hash) {
          results.push({ skinId, status: 'skipped' })
          continue
        }

        const r2Key = getLeagueSkinR2Key(skin.championId, skinId, skin.parentSkinId)

        if (skin.fileUrl) {
          try { await deleteFromR2(skin.fileUrl) } catch {}
        }

        await uploadToR2(r2Key, buffer, 'application/zip')

        await prisma.leagueSkin.update({
          where: { skinId },
          data: {
            fileUrl: r2Key,
            fileSize: buffer.length,
            fileHash: hash,
            version: { increment: 1 },
          },
        })

        results.push({ skinId, status: 'uploaded' })
      } catch (error) {
        results.push({
          skinId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
        })
      }
    }

    const summary = {
      uploaded: results.filter(r => r.status === 'uploaded').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      errors: results.filter(r => r.status === 'error').length,
    }

    // Auto-update manifest if any files were uploaded (updates hashes + bumps version)
    if (summary.uploaded > 0) {
      try {
        await generateAndUploadManifest()
      } catch (err) {
        console.error('Manifest generation failed after bulk upload:', err)
      }
    }

    return NextResponse.json({ success: true, results, summary })
  } catch (error) {
    console.error('Error uploading league skin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

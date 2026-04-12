import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToR2, deleteFromR2, getLeagueSkinR2Key } from '@/lib/r2'
import { createHash } from 'crypto'

// PUT - Update skin metadata or replace file
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const skinId = parseInt(params.id)
    const skin = await prisma.leagueSkin.findUnique({ where: { skinId } })

    if (!skin) {
      return NextResponse.json({ error: 'Skin not found' }, { status: 404 })
    }

    const contentType = request.headers.get('content-type') || ''

    // File upload (multipart)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const hash = createHash('md5').update(buffer).digest('hex')
      const r2Key = getLeagueSkinR2Key(skin.championId, skinId, skin.parentSkinId)

      if (skin.fileUrl) {
        try { await deleteFromR2(skin.fileUrl) } catch {}
      }

      await uploadToR2(r2Key, buffer, 'application/zip')

      const updated = await prisma.leagueSkin.update({
        where: { skinId },
        data: {
          fileUrl: r2Key,
          fileSize: buffer.length,
          fileHash: hash,
          version: { increment: 1 },
        },
      })

      return NextResponse.json({ success: true, skin: updated })
    }

    // JSON metadata update
    const body = await request.json()
    const data: any = {}

    if (body.nameEn !== undefined) data.nameEn = body.nameEn
    if (body.nameVi !== undefined) data.nameVi = body.nameVi
    if (body.isActive !== undefined) data.isActive = body.isActive

    const updated = await prisma.leagueSkin.update({
      where: { skinId },
      data,
    })

    return NextResponse.json({ success: true, skin: updated })
  } catch (error) {
    console.error('Error updating skin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a skin's file from R2 (keep metadata)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const skinId = parseInt(params.id)
    const skin = await prisma.leagueSkin.findUnique({ where: { skinId } })

    if (!skin) {
      return NextResponse.json({ error: 'Skin not found' }, { status: 404 })
    }

    if (skin.fileUrl) {
      await deleteFromR2(skin.fileUrl)
    }

    await prisma.leagueSkin.update({
      where: { skinId },
      data: { fileUrl: null, fileSize: null, fileHash: null },
    })

    return NextResponse.json({ success: true, message: 'File removed' })
  } catch (error) {
    console.error('Error deleting skin file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

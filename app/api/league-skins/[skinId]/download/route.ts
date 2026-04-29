import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPresignedDownloadUrl } from '@/lib/r2'

// Prevent Next.js from caching presigned URLs
export const dynamic = 'force-dynamic'

// GET - Download a skin file via presigned URL
export async function GET(
  request: NextRequest,
  { params }: { params: { skinId: string } }
) {
  try {
    const skinId = parseInt(params.skinId)

    if (isNaN(skinId)) {
      return NextResponse.json({ error: 'Invalid skin ID' }, { status: 400 })
    }

    const skin = await prisma.leagueSkin.findUnique({
      where: { skinId },
    })

    if (!skin || !skin.fileUrl || !skin.isActive) {
      return NextResponse.json({ error: 'Skin not found' }, { status: 404 })
    }

    const presignedUrl = await getPresignedDownloadUrl(skin.fileUrl, 3600)

    return NextResponse.redirect(presignedUrl)
  } catch (error) {
    console.error('Error downloading skin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

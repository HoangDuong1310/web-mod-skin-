import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPresignedDownloadUrl, existsInR2, extractR2Key } from '@/lib/r2'

export const dynamic = 'force-dynamic'

// Common download handler for both GET and POST
async function handleDownload(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log('Download request for skin:', id)

    // No authentication required - public downloads for approved skins

    // Find the custom skin (published skins, not submissions)
    const skin = await prisma.customSkin.findFirst({
      where: {
        id,
        status: 'APPROVED',
        deletedAt: null
      }
    })

    if (!skin) {
      return NextResponse.json({ error: 'Skin not found' }, { status: 404 })
    }

    // Extract R2 key from stored path
    const r2Key = extractR2Key(skin.filePath)
    console.log('R2 key for skin:', r2Key)

    // Check if file exists in R2
    const fileExists = await existsInR2(r2Key)
    if (!fileExists) {
      console.log('File not found in R2:', r2Key)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Track download in database
    try {
      await prisma.customSkin.update({
        where: { id },
        data: {
          downloadCount: {
            increment: 1
          }
        }
      })
      console.log('Download tracked successfully')
    } catch (dbError) {
      console.log('Warning: Could not track download:', dbError)
    }

    // Generate presigned URL and redirect (1 hour expiry)
    const presignedUrl = await getPresignedDownloadUrl(r2Key, 3600)

    return NextResponse.redirect(presignedUrl)

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Export both GET and POST methods
export async function GET(
  request: NextRequest,
  params: { params: { id: string } }
) {
  return handleDownload(request, params)
}

export async function POST(
  request: NextRequest,
  params: { params: { id: string } }
) {
  return handleDownload(request, params)
}
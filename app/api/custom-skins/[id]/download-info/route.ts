import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

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

    // Return download information without triggering actual download
    const baseUrl = process.env.NEXTAUTH_URL || `http://${request.headers.get('host')}`
    
    return NextResponse.json({
      skinId: skin.id,
      name: skin.name,
      fileName: skin.fileName,
      downloadUrl: `${baseUrl}/api/custom-skins/${skin.id}/download`,
      directDownloadUrl: `${baseUrl}/api/custom-skins/${skin.id}/download`,
      appProtocol: `skinmod://download?url=${encodeURIComponent(`${baseUrl}/api/custom-skins/${skin.id}/download`)}&skinId=${skin.id}`,
      fileSize: skin.fileSize,
      fileType: skin.fileType
    })
  } catch (error) {
    console.error('Download info error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
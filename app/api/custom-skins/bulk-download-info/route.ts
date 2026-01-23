import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { skinIds } = await request.json()

    if (!Array.isArray(skinIds) || skinIds.length === 0) {
      return NextResponse.json({ error: 'skinIds array is required' }, { status: 400 })
    }

    // Limit to prevent abuse
    if (skinIds.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 skins per request' }, { status: 400 })
    }

    // Get skin information
    const skins = await prisma.skinSubmission.findMany({
      where: {
        id: { in: skinIds },
        status: 'APPROVED',
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        fileName: true,
        filePath: true,
        fileSize: true,
        fileType: true,
        updatedAt: true
      }
    })

    // Format response
    // Get base URL for generating absolute URLs - use a robust method
    let baseUrl = process.env.NEXTAUTH_URL

    if (!baseUrl) {
        // Try to get from forwarded headers (for proxy/load balancer setups)
        const forwardedHost = request.headers.get('x-forwarded-host')
        const host = request.headers.get('host')
        const protocol = request.headers.get('x-forwarded-proto') || 'https'

        if (forwardedHost) {
            baseUrl = `${protocol}://${forwardedHost.split(',')[0].trim()}`
        } else if (host) {
            baseUrl = `${protocol}://${host}`
        } else {
            // Extract from request.url as fallback
            try {
                const url = new URL(request.url)
                baseUrl = `${url.protocol}//${url.host}`
            } catch {
                // Cannot determine base URL - this is a configuration error
                return NextResponse.json(
                    { error: 'Server configuration error: Cannot determine base URL. NEXTAUTH_URL must be set.' },
                    { status: 500 }
                )
            }
        }

    const result = skinIds.map(skinId => {
      const skin = skins.find(s => s.id === skinId)
      
      if (!skin) {
        return {
          skinId,
          name: null,
          fileName: null,
          downloadUrl: null,
          fileSize: null,
          fileType: null,
          lastModified: null,
          status: 'NOT_FOUND' as const
        }
      }

      return {
        skinId: skin.id,
        name: skin.name,
        fileName: skin.fileName,
        downloadUrl: `${baseUrl}/api/custom-skins/${skin.id}/download`,
        fileSize: skin.fileSize,
        fileType: skin.fileType,
        lastModified: skin.updatedAt.toISOString(),
        status: 'APPROVED' as const
      }
    })

    return NextResponse.json({ skins: result })
  } catch (error) {
    console.error('Bulk download info error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
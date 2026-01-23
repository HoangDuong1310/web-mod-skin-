import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { skins } = await request.json()

    if (!Array.isArray(skins) || skins.length === 0) {
      return NextResponse.json({ error: 'skins array is required' }, { status: 400 })
    }

    if (skins.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 skins per request' }, { status: 400 })
    }

    const skinIds = skins.map(s => s.skinId)

    const serverSkins = await prisma.skinSubmission.findMany({
      where: {
        id: { in: skinIds },
        status: 'APPROVED',
        deletedAt: null
      },
      select: {
        id: true,
        version: true,
        fileSize: true,
        updatedAt: true
      }
    })

    let baseUrl = process.env.NEXTAUTH_URL

    if (!baseUrl) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const host = request.headers.get('host')
      const protocol = request.headers.get('x-forwarded-proto') || 'https'

      if (forwardedHost) {
        baseUrl = `${protocol}://${forwardedHost.split(',')[0].trim()}`
      } else if (host) {
        baseUrl = `${protocol}://${host}`
      } else {
        try {
          const url = new URL(request.url)
          baseUrl = `${url.protocol}//${url.host}`
        } catch {
          return NextResponse.json(
            { error: 'Server configuration error: Cannot determine base URL. NEXTAUTH_URL must be set.' },
            { status: 500 }
          )
        }
      }
    }

    const updates = skins.map(localSkin => {
      const serverSkin = serverSkins.find(s => s.id === localSkin.skinId)

      if (!serverSkin) {
        return {
          skinId: localSkin.skinId,
          hasUpdate: false,
          reason: 'Skin not found on server'
        }
      }

      let hasUpdate = false
      const reasons = []

      if (localSkin.localVersion && serverSkin.version !== localSkin.localVersion) {
        hasUpdate = true
        reasons.push('Version mismatch')
      }

      if (localSkin.localFileSize && serverSkin.fileSize !== localSkin.localFileSize) {
        hasUpdate = true
        reasons.push('File size changed')
      }

      if (localSkin.lastDownloaded) {
        const localDate = new Date(localSkin.lastDownloaded)
        const serverDate = new Date(serverSkin.updatedAt)

        if (serverDate > localDate) {
          hasUpdate = true
          reasons.push('Server version is newer')
        }
      }

      return {
        skinId: localSkin.skinId,
        hasUpdate,
        serverVersion: serverSkin.version,
        serverFileSize: serverSkin.fileSize,
        serverLastModified: serverSkin.updatedAt.toISOString(),
        downloadUrl: hasUpdate ? `${baseUrl}/api/custom-skins/${localSkin.skinId}/download` : undefined,
        reasons: reasons.length > 0 ? reasons : undefined
      }
    })

    return NextResponse.json({ updates })
  } catch (error) {
    console.error('Check updates error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

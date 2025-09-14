import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { skins } = await request.json()

    if (!Array.isArray(skins) || skins.length === 0) {
      return NextResponse.json({ error: 'skins array is required' }, { status: 400 })
    }

    // Limit to prevent abuse
    if (skins.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 skins per request' }, { status: 400 })
    }

    const skinIds = skins.map(s => s.skinId)

    // Get current server information for these skins
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

    const baseUrl = process.env.NEXTAUTH_URL || `http://${request.headers.get('host')}`

    // Compare each local skin with server version
    const updates = skins.map(localSkin => {
      const serverSkin = serverSkins.find(s => s.id === localSkin.skinId)
      
      if (!serverSkin) {
        return {
          skinId: localSkin.skinId,
          hasUpdate: false,
          reason: 'Skin not found on server'
        }
      }

      // Check for updates based on various criteria
      let hasUpdate = false
      const reasons = []

      // Version comparison
      if (localSkin.localVersion && serverSkin.version !== localSkin.localVersion) {
        hasUpdate = true
        reasons.push('Version mismatch')
      }

      // File size comparison
      if (localSkin.localFileSize && serverSkin.fileSize !== localSkin.localFileSize) {
        hasUpdate = true
        reasons.push('File size changed')
      }

      // Last modified comparison
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
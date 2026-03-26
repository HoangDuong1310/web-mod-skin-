import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToR2, R2_PREFIXES, getR2PublicUrl, listR2Objects } from '@/lib/r2'

// POST - Generate and upload manifest.json to R2
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const manifest = await generateManifest()

    // Upload manifest to R2
    const manifestBuffer = Buffer.from(JSON.stringify(manifest), 'utf-8')
    const r2Key = `${R2_PREFIXES.LEAGUE_SKINS}/manifest.json`

    await uploadToR2(r2Key, manifestBuffer, 'application/json')

    return NextResponse.json({
      success: true,
      url: getR2PublicUrl(r2Key),
      stats: {
        skins: Object.keys(manifest.skins).length,
        resourceLanguages: manifest.resources.length,
      },
    })
  } catch (error) {
    console.error('Error generating manifest:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateManifest() {
  const skins = await prisma.leagueSkin.findMany({
    where: { isActive: true, fileUrl: { not: null } },
    select: { skinId: true, fileHash: true, fileSize: true },
    orderBy: [{ championId: 'asc' }, { skinId: 'asc' }],
  })

  // Detect available resource languages on R2
  const resourceObjects = await listR2Objects(`${R2_PREFIXES.LEAGUE_SKINS}/resources/`)
  const resourceLanguages: string[] = []
  for (const obj of resourceObjects) {
    const match = obj.key.match(/resources\/([^/]+)\/skin_ids\.json$/)
    if (match) resourceLanguages.push(match[1])
  }

  const skinsMap: Record<string, { hash: string | null; size: number | null }> = {}
  for (const s of skins) {
    skinsMap[s.skinId.toString()] = {
      hash: s.fileHash ? s.fileHash.substring(0, 8) : null,
      size: s.fileSize,
    }
  }

  return {
    version: Date.now(),
    resources: resourceLanguages,
    skins: skinsMap,
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getR2PublicUrl, R2_PREFIXES } from '@/lib/r2'
import { generateAndUploadManifest } from '@/lib/league-skins-manifest'

// POST - Generate and upload manifest.json to R2
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await generateAndUploadManifest()

    return NextResponse.json({
      success: true,
      url: getR2PublicUrl(`${R2_PREFIXES.LEAGUE_SKINS}/manifest.json`),
      stats: {
        skins: result.skinsCount,
        resourceLanguages: result.resourceLanguages,
      },
    })
  } catch (error) {
    console.error('Error generating manifest:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

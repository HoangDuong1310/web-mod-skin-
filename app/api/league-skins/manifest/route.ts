import { NextResponse } from 'next/server'
import { getBufferFromR2, R2_PREFIXES } from '@/lib/r2'

export const dynamic = 'force-dynamic'

// GET - Return the current manifest.json from R2
export async function GET() {
  try {
    const r2Key = `${R2_PREFIXES.LEAGUE_SKINS}/manifest.json`
    const { buffer } = await getBufferFromR2(r2Key)
    const manifest = JSON.parse(buffer.toString('utf-8'))

    return NextResponse.json(manifest, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    })
  } catch (error) {
    console.error('Error fetching manifest:', error)
    return NextResponse.json(
      { error: 'Manifest not found. Generate it from admin panel.' },
      { status: 404 }
    )
  }
}

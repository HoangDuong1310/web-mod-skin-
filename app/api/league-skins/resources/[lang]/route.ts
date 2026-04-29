import { NextRequest, NextResponse } from 'next/server'
import { getBufferFromR2, R2_PREFIXES } from '@/lib/r2'

export const dynamic = 'force-dynamic'

// Allowed language codes to prevent path traversal
const ALLOWED_LANGS = new Set([
  'ar', 'cs', 'de', 'default', 'el', 'en', 'es', 'fr', 'hu',
  'id', 'it', 'ja', 'ko', 'pl', 'pt', 'ro', 'ru', 'th', 'tr', 'vi', 'zh',
])

// GET - Download skin_ids.json for a specific language
export async function GET(
  request: NextRequest,
  { params }: { params: { lang: string } }
) {
  try {
    const { lang } = params

    if (!ALLOWED_LANGS.has(lang)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 })
    }

    const r2Key = `${R2_PREFIXES.LEAGUE_SKINS}/resources/${lang}/skin_ids.json`
    const { buffer, contentType } = await getBufferFromR2(r2Key)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType || 'application/json',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'Content-Disposition': `attachment; filename="skin_ids_${lang}.json"`,
      },
    })
  } catch (error) {
    console.error('Error downloading resource:', error)
    return NextResponse.json(
      { error: 'Resource not found' },
      { status: 404 }
    )
  }
}

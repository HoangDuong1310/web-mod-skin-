import { NextResponse } from 'next/server'
import { existsInR2, getPresignedDownloadUrl } from '@/lib/r2'
import { PACKAGE_KEY } from '@/lib/league-skins-package'

/**
 * GET - Download the full league-skins package
 * Returns a presigned URL redirect to the zip on R2
 */
export async function GET() {
  try {
    const exists = await existsInR2(PACKAGE_KEY)

    if (!exists) {
      return NextResponse.json(
        { error: 'Package not available. Admin needs to build it first.' },
        { status: 404 }
      )
    }

    const presignedUrl = await getPresignedDownloadUrl(PACKAGE_KEY, 3600)

    return NextResponse.redirect(presignedUrl)
  } catch (error) {
    console.error('Error downloading package:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

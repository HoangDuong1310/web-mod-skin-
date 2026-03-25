import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { getBufferFromR2, R2_PREFIXES } from '@/lib/r2'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename
    // Validate filename to prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return new NextResponse('Access denied', { status: 400 });
    }

    const r2Key = `${R2_PREFIXES.SOFTWARE}/${filename}`

    try {
      const { buffer, contentType } = await getBufferFromR2(r2Key)

      // Determine content type based on file extension
      const ext = path.extname(filename).toLowerCase()
      const contentTypes: { [key: string]: string } = {
        '.exe': 'application/x-msdownload',
        '.msi': 'application/x-msi',
        '.zip': 'application/zip',
        '.rar': 'application/x-rar-compressed',
        '.7z': 'application/x-7z-compressed',
        '.tar': 'application/x-tar',
        '.gz': 'application/gzip',
        '.deb': 'application/vnd.debian.binary-package',
        '.rpm': 'application/x-rpm',
        '.dmg': 'application/x-apple-diskimage',
        '.pkg': 'application/x-newton-compatible-pkg'
      }

      const resolvedContentType = contentTypes[ext] || contentType || 'application/octet-stream'

      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': resolvedContentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'public, max-age=3600',
          'Content-Length': buffer.length.toString(),
        },
      })
    } catch (error) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

  } catch (error) {
    console.error('File serving error:', error)
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    )
  }
}

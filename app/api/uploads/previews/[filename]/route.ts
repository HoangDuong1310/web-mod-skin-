import { NextRequest, NextResponse } from 'next/server'
import { getBufferFromR2, R2_PREFIXES } from '@/lib/r2'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename

    // SECURITY: Prevent Path Traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      console.warn(`Path traversal attempt blocked: ${filename}`);
      return new NextResponse('Invalid filename', { status: 400 });
    }

    const r2Key = `${R2_PREFIXES.PREVIEWS}/${filename}`

    try {
      const { buffer, contentType: r2ContentType } = await getBufferFromR2(r2Key)

      // Determine content type based on file extension
      const extension = filename.split('.').pop()?.toLowerCase()
      let contentType = r2ContentType || 'application/octet-stream'

      switch (extension) {
        case 'jpg':
        case 'jpeg':
          contentType = 'image/jpeg'
          break
        case 'png':
          contentType = 'image/png'
          break
        case 'webp':
          contentType = 'image/webp'
          break
        case 'gif':
          contentType = 'image/gif'
          break
      }

      // Return the file with appropriate headers
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    } catch {
      return new NextResponse('Preview not found', { status: 404 })
    }

  } catch (error) {
    console.error('Error serving preview image:', error)
    return new NextResponse('Image not found', { status: 404 })
  }
}
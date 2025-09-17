import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename

    // Use absolute base path from env if provided, fallback to public/uploads for local
    const base = process.env.UPLOADS_BASE_PATH || join(process.cwd(), 'public', 'uploads')
    const filePath = join(base, 'previews', filename)

    // Read the file
    const fileBuffer = await readFile(filePath)

    // Determine content type based on file extension
    const extension = filename.split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'

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
    return new NextResponse(fileBuffer as any, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })

  } catch (error) {
    console.error('Error serving preview image:', error)
    return new NextResponse('Image not found', { status: 404 })
  }
}
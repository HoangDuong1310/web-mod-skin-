import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join, resolve } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename
    //Nên validate chống path traversal
    //Tui ko rõ có ảnh hưởng gì đến logic gửi file lên không nhưng ông nên check lại flow
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return new NextResponse('Access denied', { status: 400 });
    }

    const base = process.env.UPLOADS_BASE_PATH || join(process.cwd(), 'uploads')
    const imagesBase = join(base, 'images', 'products');
    const filePath = resolve(imagesBase, filename)

    // FIX: Add sep to prevent sibling directory traversal
    if (!filePath.startsWith(resolve(imagesBase) + require('path').sep) && filePath !== resolve(imagesBase)) {
      return new NextResponse('Access denied', { status: 403 });
    }

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
    console.error('Error serving image:', error)
    return new NextResponse('Image not found', { status: 404 })
  }
}

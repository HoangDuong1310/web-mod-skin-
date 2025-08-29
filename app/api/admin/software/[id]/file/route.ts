import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/x-msdownload', // .exe
      'application/x-msi', // .msi
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/gzip',
      'application/vnd.debian.binary-package', // .deb
      'application/x-rpm', // .rpm
      'application/x-apple-diskimage', // .dmg
      'application/x-newton-compatible-pkg' // .pkg
    ]

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(exe|msi|zip|rar|7z|tar\.gz|deb|rpm|dmg|pkg)$/i)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Validate file size (100MB max)
    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 400 })
    }

    // Generate safe filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}_${originalName}`
    
    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'uploads/software')
    
    try {
      await import('fs').then(fs => fs.promises.mkdir(uploadDir, { recursive: true }))
    } catch (error) {
      console.error('Failed to create upload directory:', error)
    }

    const filePath = path.join(uploadDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Update product with file info
    await prisma.product.update({
      where: { id: params.id },
      data: {
        filename: originalName,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        downloadUrl: `/uploads/software/${filename}`
      }
    })

    return NextResponse.json({
      message: 'File uploaded successfully',
      filename: originalName,
      size: file.size,
      downloadUrl: `/uploads/software/${filename}`
    })

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadToR2, generateR2Key, getR2PublicUrl, R2_PREFIXES } from '@/lib/r2'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB for skin files
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB for images

const ACCEPTED_SKIN_TYPES = ['zip', 'rar', 'fantome']
const ACCEPTED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'webp']

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'skin' or 'preview'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Get file extension
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension) {
      return NextResponse.json(
        { error: 'Invalid file name' },
        { status: 400 }
      )
    }

    // Validate file based on type
    if (type === 'skin') {
      // Validate skin file
      if (!ACCEPTED_SKIN_TYPES.includes(extension)) {
        return NextResponse.json(
          { error: `Invalid skin file type. Accepted types: ${ACCEPTED_SKIN_TYPES.join(', ')}` },
          { status: 400 }
        )
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'File size exceeds 50MB limit' },
          { status: 400 }
        )
      }
    } else if (type === 'preview') {
      // Validate image file
      if (!ACCEPTED_IMAGE_TYPES.includes(extension)) {
        return NextResponse.json(
          { error: `Invalid image type. Accepted types: ${ACCEPTED_IMAGE_TYPES.join(', ')}` },
          { status: 400 }
        )
      }

      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { error: 'Image size exceeds 5MB limit' },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid file type specified' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Determine R2 prefix based on type
    const prefix = type === 'skin' ? R2_PREFIXES.SKINS : R2_PREFIXES.PREVIEWS

    // Generate R2 key and upload
    const r2Key = generateR2Key(prefix, file.name)
    const contentType = type === 'skin' ? 'application/octet-stream' : `image/${extension}`
    await uploadToR2(r2Key, buffer, contentType)

    // Return R2 public URL for database storage
    const publicUrl = getR2PublicUrl(r2Key)

    return NextResponse.json({
      message: 'File uploaded successfully',
      fileName: r2Key.split('/').pop()!,
      filePath: publicUrl,
      r2Key: r2Key,
      fileSize: file.size,
      fileType: extension!.toUpperCase()
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
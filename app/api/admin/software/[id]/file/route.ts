import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadToR2, deleteFromR2, generateR2Key, R2_PREFIXES } from '@/lib/r2'

export const runtime = 'nodejs'
// Extend timeout for large file uploads
export const maxDuration = 300; // 5 minutes for Pro/Enterprise Vercel plans
export const dynamic = 'force-dynamic'

const defaultAllowedOrigins = [
  'https://modskinslol.com',
  'https://www.modskinslol.com',
  'https://upload.modskinslol.com',
]

function normalizeOrigin(value?: string | null): string {
  return value?.trim().replace(/\/+$/, '') || ''
}

function getCorsHeaders(request: NextRequest) {
  const configuredOrigins = [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_UPLOAD_BASE_URL,
    process.env.UPLOAD_BASE_URL,
  ]
    .map(normalizeOrigin)
    .filter(Boolean)

  const allowedOrigins = new Set([...defaultAllowedOrigins, ...configuredOrigins])
  const requestOrigin = normalizeOrigin(request.headers.get('origin'))
  const allowOrigin = allowedOrigins.has(requestOrigin)
    ? requestOrigin
    : defaultAllowedOrigins[0]

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': request.headers.get('access-control-request-headers') || 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin, Access-Control-Request-Headers',
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(request),
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Set headers to bypass Cloudflare and optimize for large uploads
  const headers = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'CF-Cache-Status': 'BYPASS',
    'X-Accel-Buffering': 'no', // Disable nginx buffering
    ...getCorsHeaders(request), // Add CORS headers
  }

  console.log(`🔵 Starting file upload to R2 for product ${params.id}`)
  const startTime = Date.now()
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.log('❌ No file provided in request')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log(`📁 File details: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB, Type: ${file.type}`)

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
      console.log(`❌ Invalid file type: ${file.type}`)
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Validate file size (300MB max)
    const maxSize = 300 * 1024 * 1024
    console.log('Software upload size (bytes):', file.size)
    if (file.size > maxSize) {
      console.log(`❌ File too large: ${file.size} bytes (max: ${maxSize})`)
      return NextResponse.json({ error: 'File too large (max 300MB)', received: file.size }, { status: 413 })
    }

    // Generate R2 key
    const r2Key = generateR2Key(R2_PREFIXES.SOFTWARE, file.name, params.id)
    console.log(`💾 Uploading to R2: ${r2Key}`)

    // Upload to R2
    const bytes = await file.arrayBuffer()
    console.log(`🔄 File converted to buffer: ${(bytes.byteLength / 1024 / 1024).toFixed(2)}MB`)
    
    const buffer = Buffer.from(bytes)
    await uploadToR2(r2Key, buffer, 'application/octet-stream')
    
    const processingTime = Date.now() - startTime
    console.log(`✅ File uploaded to R2 successfully in ${processingTime}ms`)

    // Generate proper download URL that matches the download API
    const downloadUrl = `/api/download/software/${encodeURIComponent(r2Key.split('/').pop()!)}`

    // Delete old file from R2 if exists
    const oldProduct = await prisma.product.findUnique({ where: { id: params.id } })
    if (oldProduct?.filename && (oldProduct.filename as string).includes('/')) {
      try {
        await deleteFromR2(oldProduct.filename as string)
        console.log(`🗑️ Old file deleted from R2: ${oldProduct.filename}`)
      } catch (e) {
        console.warn('Failed to delete old file from R2:', e)
      }
    }

    // Update product with file info
    await prisma.product.update({
      where: { id: params.id },
      data: {
        filename: r2Key, // Store R2 key
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        downloadUrl: downloadUrl
      }
    })

    console.log(`📊 Database updated for product ${params.id}`)

    return NextResponse.json({
      message: 'File uploaded successfully',
      filename: r2Key,
      size: file.size,
      downloadUrl: downloadUrl,
      processingTimeMs: processingTime
    }, { headers })

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`❌ File upload error after ${processingTime}ms:`, error)
    
    // More detailed error information
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: processingTime
      },
      { status: 500, headers }
    )
  }
}

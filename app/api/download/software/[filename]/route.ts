import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPresignedDownloadUrl, existsInR2 } from '@/lib/r2'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename

    // Security: Validate filename to prevent path traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { message: 'Invalid filename' },
        { status: 400 }
      )
    }

    // Find product by filename (R2 key stored as software/filename or just filename)
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { filename: `software/${filename}` },
          { filename: { endsWith: filename } }
        ]
      },
      include: { category: true }
    })

    if (!product) {
      return NextResponse.json(
        { message: 'Software not found' },
        { status: 404 }
      )
    }

    if (product.status !== 'PUBLISHED') {
      return NextResponse.json(
        { message: 'Software not available for download' },
        { status: 403 }
      )
    }

    // Get the R2 key from the product
    const r2Key = (product as any).filename as string
    if (!r2Key) {
      return NextResponse.json(
        { message: 'No file associated with this product' },
        { status: 404 }
      )
    }

    // Check file exists in R2
    const fileExists = await existsInR2(r2Key)
    if (!fileExists) {
      return NextResponse.json(
        { message: 'File not found in storage' },
        { status: 404 }
      )
    }

    // Log download for analytics
    try {
      const session = await getServerSession(authOptions)
      
      await prisma.download.create({
        data: {
          userId: session?.user?.id || null,
          productId: product.id,
          downloadIp: request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      })
      
      console.log('Download logged for product:', product.id)
    } catch (logError) {
      console.warn('Failed to log download:', logError)
    }

    // Generate presigned URL and redirect (1 hour expiry)
    const presignedUrl = await getPresignedDownloadUrl(r2Key, 3600)

    return NextResponse.redirect(presignedUrl)

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { message: 'Failed to download file' },
      { status: 500 }
    )
  }
}

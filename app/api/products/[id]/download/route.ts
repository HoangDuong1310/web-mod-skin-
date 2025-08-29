import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const productId = params.id

    // Find product
    const product = await prisma.product.findUnique({
      where: { 
        id: productId,
        status: 'PUBLISHED',
        deletedAt: null 
      }
    })

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if product has download file
    if (!(product as any).downloadUrl && !(product as any).filename) {
      return NextResponse.json(
        { message: 'No download available for this product' },
        { status: 400 }
      )
    }

    // Log download if user is authenticated
    if (session?.user?.id) {
      await prisma.download.create({
        data: {
          userId: session.user.id,
          productId: product.id,
          downloadIp: request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      })
    }

    // Return download info
    const downloadInfo = {
      productId: product.id,
      title: product.title,
      version: (product as any).version,
      fileSize: (product as any).fileSize,
      downloadUrl: (product as any).downloadUrl,
      filename: (product as any).filename
    }

    // If it's an external URL, return directly
    if ((product as any).downloadUrl) {
      return NextResponse.json({
        ...downloadInfo,
        redirect: (product as any).downloadUrl
      })
    }

    // If it's a local file, return API endpoint
    if ((product as any).filename) {
      return NextResponse.json({
        ...downloadInfo,
        redirect: `/api/download/software/${(product as any).filename}`
      })
    }

    return NextResponse.json(
      { message: 'No download method available' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Download API error:', error)
    return NextResponse.json(
      { message: 'Failed to process download request' },
      { status: 500 }
    )
  }
}
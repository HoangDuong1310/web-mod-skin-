import { NextRequest, NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id

    // Verify product exists and is published
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      )
    }

    if (product.status !== 'PUBLISHED') {
      return NextResponse.json(
        { message: 'Product not available for download' },
        { status: 403 }
      )
    }

    try {
      // Find the file in uploads directory that matches the product ID pattern
      const uploadsDir = join(process.cwd(), 'uploads', 'software')
      const files = await readdir(uploadsDir)
      
      // Look for files with pattern: product_{productId}_timestamp.ext
      const productFile = files.find(file => 
        file.startsWith(`product_${productId}_`)
      )

      if (!productFile) {
        return NextResponse.json(
          { message: 'Download file not found' },
          { status: 404 }
        )
      }

      // Extract original filename from the stored filename
      const parts = productFile.split('_')
      const originalFilename = parts.slice(2).join('_')
      const extension = originalFilename.split('.').pop()
      const cleanFilename = `${product.title.replace(/[^a-zA-Z0-9.-]/g, '_')}.${extension}`

      return NextResponse.json({
        downloadUrl: `/api/download/software/${productFile}`,
        filename: cleanFilename,
        productTitle: product.title
      })

    } catch (error) {
      console.error('Error reading uploads directory:', error)
      return NextResponse.json(
        { message: 'Download not available' },
        { status: 503 }
      )
    }

  } catch (error) {
    console.error('Download info error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const productId = params.id
    const body = await request.json()
    
    const { downloadUrl, filename, fileSize, version, externalUrl } = body

    // Update product with download information
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        downloadUrl: downloadUrl || null,
        filename: filename || null,
        fileSize: fileSize || null,
        version: version || null,
        externalUrl: externalUrl || null,
        updatedAt: new Date()
      } as any
    })

    return NextResponse.json({
      message: 'Product download information updated successfully',
      product: {
        id: product.id,
        title: product.title,
        downloadUrl: (product as any).downloadUrl,
        filename: (product as any).filename,
        fileSize: (product as any).fileSize,
        version: (product as any).version,
        externalUrl: (product as any).externalUrl
      }
    })

  } catch (error) {
    console.error('Update product download error:', error)
    return NextResponse.json(
      { message: 'Failed to update product download information' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all products with images data
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        images: true
      }
    })

    let fixedCount = 0
    const issues: any[] = []

    for (const product of products) {
      let needsUpdate = false
      let newImages = null

      try {
        // Check if images is already valid JSON
        if (product.images) {
          if (typeof product.images === 'string') {
            // Try to parse as JSON
            const parsed = JSON.parse(product.images as string)
            if (Array.isArray(parsed)) {
              // Filter out invalid URLs
              const validImages = parsed.filter((img: any) => 
                typeof img === 'string' && 
                img.length > 1 && 
                img !== '[' && 
                img !== ']' && 
                (img.startsWith('/') || img.startsWith('http'))
              )
              newImages = validImages
              needsUpdate = true
            }
          } else if (Array.isArray(product.images)) {
            // Already an array, validate URLs
            const validImages = (product.images as any[]).filter((img: any) => 
              typeof img === 'string' && 
              img.length > 1 && 
              img !== '[' && 
              img !== ']' && 
              (img.startsWith('/') || img.startsWith('http'))
            )
            newImages = validImages
            needsUpdate = true
          } else {
            // Invalid format, set to empty array
            newImages = []
            needsUpdate = true
          }
        }
      } catch (error) {
        // Failed to parse, set to empty array
        newImages = []
        needsUpdate = true
        issues.push({
          productId: product.id,
          title: product.title,
          error: error instanceof Error ? error.message : 'Unknown error',
          originalImages: product.images
        })
      }

      if (needsUpdate) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            images: newImages || []
          }
        })
        fixedCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed images data for ${fixedCount} products`,
      totalProducts: products.length,
      fixedCount,
      issues
    })

  } catch (error) {
    console.error('Error fixing images data:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to fix images data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

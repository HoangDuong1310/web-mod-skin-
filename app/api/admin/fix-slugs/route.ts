import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function generateValidSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace any non-alphanumeric characters with dashes
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
}

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

    // Get all products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        content: true
      }
    })

    let fixedCount = 0
    const updates: any[] = []

    for (const product of products) {
      // Generate new valid slug from title only
      const baseSlug = generateValidSlug(product.title)
      
      if (product.slug !== baseSlug) {
        // Check if new slug already exists and make it unique
        let uniqueSlug = baseSlug
        let counter = 1
        
        while (true) {
          const existingProduct = await prisma.product.findUnique({
            where: { slug: uniqueSlug, NOT: { id: product.id } }
          })
          
          if (!existingProduct) {
            break // Slug is unique
          }
          
          uniqueSlug = `${baseSlug}-${counter}`
          counter++
        }

        await prisma.product.update({
          where: { id: product.id },
          data: { slug: uniqueSlug }
        })

        updates.push({
          productId: product.id,
          title: product.title,
          oldSlug: product.slug,
          newSlug: uniqueSlug
        })

        fixedCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated slugs for ${fixedCount} products`,
      totalProducts: products.length,
      fixedCount,
      updates
    })

  } catch (error) {
    console.error('Error fixing slugs:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to fix slugs',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Update all slugs that contain version numbers (have dots followed by numbers)
    const productsWithVersionInSlug = await prisma.product.findMany({
      where: {
        slug: {
          contains: '.'  // Find slugs containing dots (version numbers)
        }
      },
      select: {
        id: true,
        title: true,
        slug: true
      }
    })

    let updated = 0
    const updates = []

    for (const product of productsWithVersionInSlug) {
      // Generate new slug from title only
      const newSlug = product.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-+/g, '-')

      // Check if slug exists
      const existing = await prisma.product.findUnique({
        where: { slug: newSlug, NOT: { id: product.id } }
      })

      let finalSlug = newSlug
      if (existing) {
        finalSlug = `${newSlug}-${Date.now()}`
      }

      await prisma.product.update({
        where: { id: product.id },
        data: { slug: finalSlug }
      })

      updates.push({
        id: product.id,
        title: product.title,
        oldSlug: product.slug,
        newSlug: finalSlug
      })

      updated++
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} product slugs`,
      updates
    })

  } catch (error) {
    console.error('Error updating slugs:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

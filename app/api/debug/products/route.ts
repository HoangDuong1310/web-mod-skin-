import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get all products with their slugs
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        deletedAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      products,
      count: products.length
    })

  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to fetch products',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

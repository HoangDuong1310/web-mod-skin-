import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.skinCategory.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        _count: {
          select: {
            customSkins: true
          }
        }
      }
    })

    return NextResponse.json({
      categories: categories.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        skinCount: category._count.customSkins
      }))
    })

  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json({
      error: 'Failed to get categories'
    }, { status: 500 })
  }
}
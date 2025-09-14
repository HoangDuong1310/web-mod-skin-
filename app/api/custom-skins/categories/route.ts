import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await (prisma as any).skinCategory.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: {
          select: {
            customSkins: {
              where: {
                status: 'APPROVED'
              }
            }
          }
        }
      }
    })

    // Add skin count to each category
    const categoriesWithCount = categories.map((category: any) => ({
      ...category,
      skinCount: category._count.customSkins
    }))

    return NextResponse.json({ categories: categoriesWithCount })
  } catch (error) {
    console.error('Error fetching skin categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const championId = searchParams.get('championId')
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const offset = (page - 1) * limit

    const where: any = {
      status: 'APPROVED',
      deletedAt: null
    }

    if (championId) {
      where.championId = parseInt(championId)
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ]
    }

    const [skins, total] = await Promise.all([
      (prisma as any).customSkin.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          champion: {
            select: {
              id: true,
              name: true,
              alias: true,
              squarePortraitPath: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          author: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      (prisma as any).customSkin.count({ where })
    ])

    // Parse preview images from JSON
    const parsedSkins = skins.map((skin: any) => ({
      ...skin,
      previewImages: skin.previewImages ? JSON.parse(skin.previewImages) : []
    }))

    return NextResponse.json({
      skins: parsedSkins,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching custom skins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch custom skins' },
      { status: 500 }
    )
  }
}
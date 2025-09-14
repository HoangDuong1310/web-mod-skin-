import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/custom-skins/my-gallery
 * Get current user's approved custom skins (personal gallery)
 * Requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50)
    const championId = searchParams.get('championId')
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'newest'

    // Build where clause
    const where: any = {
      authorId: session.user.id,
      status: 'APPROVED' // Only show approved skins in personal gallery
    }

    if (championId && championId !== 'all') {
      where.championId = parseInt(championId)
    }

    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' }
    if (sortBy === 'popular') {
      orderBy = { downloadCount: 'desc' }
    } else if (sortBy === 'downloads') {
      orderBy = { downloadCount: 'desc' }
    }

    // Get total count
    const total = await prisma.customSkin.count({ where })

    // Get skins with pagination
    const skins = await prisma.customSkin.findMany({
      where,
      include: {
        champion: {
          select: {
            id: true,
            name: true,
            alias: true,
            squarePortraitPath: true,
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        author: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      skins: skins.map(skin => ({
        ...skin,
        previewImages: skin.previewImages || [],
        fileSize: skin.fileSize?.toString() || '0',
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      }
    })

  } catch (error) {
    console.error('Error fetching personal gallery:', error)
    return NextResponse.json(
      { error: 'Failed to fetch personal gallery' },
      { status: 500 }
    )
  }
}
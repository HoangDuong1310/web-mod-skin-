import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get all approved custom skins for admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50)
    const search = searchParams.get('search')
    const championId = searchParams.get('championId')
    const categoryId = searchParams.get('categoryId')
    const status = searchParams.get('status')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      deletedAt: null
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (championId && championId !== 'all') {
      where.championId = parseInt(championId)
    }

    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId
    }

    if (status && status !== 'all') {
      where.status = status
    }

    // Get total count
    const total = await (prisma as any).customSkin.count({ where })

    // Get skins with relations
    const skins = await (prisma as any).customSkin.findMany({
      where,
      include: {
        champion: {
          select: {
            id: true,
            name: true,
            alias: true
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
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    // Parse preview images
    const parsedSkins = skins.map((skin: any) => ({
      ...skin,
      previewImages: skin.previewImages ? JSON.parse(skin.previewImages) : []
    }))

    return NextResponse.json({
      skins: parsedSkins,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Error fetching approved skins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch skins' },
      { status: 500 }
    )
  }
}

// POST - Create new custom skin (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      version,
      championId,
      categoryId,
      fileName,
      filePath,
      fileSize,
      fileType,
      previewImages,
      thumbnailImage,
      status = 'APPROVED'
    } = body

    // Validate required fields
    if (!name || !description || !championId || !categoryId || !fileName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create skin
    const skin = await (prisma as any).customSkin.create({
      data: {
        name,
        description,
        version: version || '1.0',
        championId: parseInt(championId),
        categoryId,
        authorId: session.user.id,
        fileName,
        filePath: filePath || `/uploads/skins/${fileName}`,
        fileSize: fileSize || '0',
        fileType: fileType || 'ZIP',
        previewImages: JSON.stringify(previewImages || []),
        thumbnailImage,
        status,
        downloadCount: 0
      },
      include: {
        champion: {
          select: {
            id: true,
            name: true,
            alias: true
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
    })

    return NextResponse.json({
      message: 'Skin created successfully',
      skin: {
        ...skin,
        previewImages: skin.previewImages ? JSON.parse(skin.previewImages) : []
      }
    })
  } catch (error) {
    console.error('Error creating skin:', error)
    return NextResponse.json(
      { error: 'Failed to create skin' },
      { status: 500 }
    )
  }
}
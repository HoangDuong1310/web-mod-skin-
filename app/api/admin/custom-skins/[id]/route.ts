import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get specific approved skin for admin
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const skin = await (prisma as any).customSkin.findUnique({
      where: {
        id: params.id,
        deletedAt: null
      },
      include: {
        champion: {
          select: {
            id: true,
            name: true,
            alias: true,
            description: true,
            squarePortraitPath: true,
            roles: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true
          }
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!skin) {
      return NextResponse.json(
        { error: 'Skin not found' },
        { status: 404 }
      )
    }

    // Parse preview images and champion roles
    const parsedSkin = {
      ...skin,
      previewImages: skin.previewImages ? JSON.parse(skin.previewImages) : [],
      champion: {
        ...skin.champion,
        roles: skin.champion.roles ? JSON.parse(skin.champion.roles) : []
      }
    }

    return NextResponse.json(parsedSkin)
  } catch (error) {
    console.error('Error fetching skin:', error)
    return NextResponse.json(
      { error: 'Failed to fetch skin' },
      { status: 500 }
    )
  }
}

// PUT - Update approved skin
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      categoryId,
      status,
      previewImages,
      thumbnailImage
    } = body

    // Check if skin exists
    const existingSkin = await (prisma as any).customSkin.findUnique({
      where: {
        id: params.id,
        deletedAt: null
      }
    })

    if (!existingSkin) {
      return NextResponse.json(
        { error: 'Skin not found' },
        { status: 404 }
      )
    }

    // Update skin
    const updatedSkin = await (prisma as any).customSkin.update({
      where: {
        id: params.id
      },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(version && { version }),
        ...(categoryId && { categoryId }),
        ...(status && { status }),
        ...(previewImages && { previewImages: JSON.stringify(previewImages) }),
        ...(thumbnailImage !== undefined && { thumbnailImage }),
        updatedAt: new Date()
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
      message: 'Skin updated successfully',
      skin: {
        ...updatedSkin,
        previewImages: updatedSkin.previewImages ? JSON.parse(updatedSkin.previewImages) : []
      }
    })
  } catch (error) {
    console.error('Error updating skin:', error)
    return NextResponse.json(
      { error: 'Failed to update skin' },
      { status: 500 }
    )
  }
}

// DELETE - Delete approved skin
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if skin exists
    const existingSkin = await (prisma as any).customSkin.findUnique({
      where: {
        id: params.id,
        deletedAt: null
      }
    })

    if (!existingSkin) {
      return NextResponse.json(
        { error: 'Skin not found' },
        { status: 404 }
      )
    }

    // Soft delete the skin
    await (prisma as any).customSkin.update({
      where: {
        id: params.id
      },
      data: {
        deletedAt: new Date()
      }
    })

    return NextResponse.json({
      message: 'Skin deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting skin:', error)
    return NextResponse.json(
      { error: 'Failed to delete skin' },
      { status: 500 }
    )
  }
}
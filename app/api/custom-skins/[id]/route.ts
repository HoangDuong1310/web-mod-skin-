import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const skin = await (prisma as any).skinSubmission.findUnique({
      where: {
        id: params.id,
        status: 'APPROVED',
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
        submitter: {
          select: {
            id: true,
            name: true
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
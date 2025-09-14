import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const skin = await prisma.customSkin.findUnique({
      where: {
        id: id,
        status: 'APPROVED',
        deletedAt: null
      },
      include: {
        category: true,
        champion: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })

    if (!skin) {
      return NextResponse.json({ error: 'Skin not found' }, { status: 404 })
    }

    return NextResponse.json(skin)
  } catch (error) {
    console.error('Get skin error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
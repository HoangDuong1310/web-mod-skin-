import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const champions = await prisma.champion.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        alias: true,
        squarePortraitPath: true,
        roles: true,
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

    // Parse roles from JSON string
    const parsedChampions = champions.map(champion => ({
      ...champion,
      roles: champion.roles ? JSON.parse(champion.roles) : [],
      skinCount: champion._count.customSkins
    }))

    return NextResponse.json({
      champions: parsedChampions
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Error fetching champions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch champions' },
      { status: 500 }
    )
  }
}
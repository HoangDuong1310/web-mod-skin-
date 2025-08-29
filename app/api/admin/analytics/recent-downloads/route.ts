import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get recent downloads with detailed information
    const recentDownloads = await prisma.download.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        product: {
          include: {
            category: true,
            reviews: {
              where: {
                userId: {
                  not: null
                }
              },
              select: {
                rating: true,
                userId: true
              }
            }
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    const downloads = recentDownloads.map((item) => {
      // Find user's rating for this product
      const userRating = item.product?.reviews.find(
        review => review.userId === item.userId
      )?.rating || null

      return {
        id: item.id,
        softwareName: item.product?.title || 'Unknown Software',
        userName: item.user?.name || 'Unknown User',
        userEmail: item.user?.email || 'unknown@email.com',
        downloadDate: item.createdAt.toISOString(),
        category: item.product?.category?.name || 'Uncategorized',
        rating: userRating,
        downloadIp: item.downloadIp,
        userAgent: item.userAgent
      }
    })

    return NextResponse.json({ downloads })

  } catch (error) {
    console.error('Error fetching recent downloads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent downloads' },
      { status: 500 }
    )
  }
}

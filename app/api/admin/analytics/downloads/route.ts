import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canAccessAnalytics } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !canAccessAnalytics(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'

    // Calculate date range
    const now = new Date()
    const startDate = new Date()
    
    switch (range) {
      case '1d':
        startDate.setDate(now.getDate() - 1)
        break
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Get total downloads (all time)
    const totalDownloads = await prisma.download.count()

    // Get downloads in date range
    const rangeDownloads = await prisma.download.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: now
        }
      }
    })

    // Get daily downloads (today)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
    
    const dailyDownloads = await prisma.download.count({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    })

    // Get weekly downloads
    const weekStart = new Date()
    weekStart.setDate(now.getDate() - 7)
    
    const weeklyDownloads = await prisma.download.count({
      where: {
        createdAt: {
          gte: weekStart,
          lte: now
        }
      }
    })

    // Get monthly downloads
    const monthStart = new Date()
    monthStart.setDate(now.getDate() - 30)
    
    const monthlyDownloads = await prisma.download.count({
      where: {
        createdAt: {
          gte: monthStart,
          lte: now
        }
      }
    })

    // Get unique users who downloaded in range
    const uniqueUsersData = await prisma.download.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      select: {
        userId: true
      },
      distinct: ['userId']
    })
    const uniqueUsers = uniqueUsersData.length

    // Calculate average downloads per user
    const averageDownloadsPerUser = uniqueUsers > 0 ? rangeDownloads / uniqueUsers : 0

    // Get top downloaded software
    const topSoftwareData = await prisma.download.groupBy({
      by: ['productId'],
      _count: {
        productId: true
      },
      orderBy: {
        _count: {
          productId: 'desc'
        }
      },
      take: 10
    })

    const topSoftware = await Promise.all(
      topSoftwareData.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: {
            category: true,
            downloads: {
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            }
          }
        })

        if (!product) return null

        return {
          id: product.id,
          name: product.title,
          slug: product.slug,
          downloads: item._count.productId,
          category: product.category?.name || 'Uncategorized',
          averageRating: product.averageRating,
          totalReviews: product.totalReviews,
          lastDownload: product.downloads[0]?.createdAt.toISOString() || product.createdAt.toISOString()
        }
      })
    )

    const validTopSoftware = topSoftware.filter(Boolean)

    // Get category statistics
    const categoryData = await prisma.download.findMany({
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    })

    const categoryStats = categoryData.reduce((acc: any, item) => {
      const categoryName = item.product?.category?.name || 'Uncategorized'
      if (!acc[categoryName]) {
        acc[categoryName] = 0
      }
      acc[categoryName]++
      return acc
    }, {})

    const categoryStatsArray = Object.entries(categoryStats)
      .map(([category, downloads]) => ({
        category,
        downloads: downloads as number,
        percentage: totalDownloads > 0 ? ((downloads as number) / totalDownloads) * 100 : 0
      }))
      .sort((a, b) => b.downloads - a.downloads)

    // Get download trends (simplified - just daily counts for the range)
    const downloadTrends = []
    const trendDays = Math.min(30, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    
    for (let i = trendDays - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(now.getDate() - i)
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      const dayDownloads = await prisma.download.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      })

      const dayUniqueUsers = await prisma.download.findMany({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        },
        select: {
          userId: true
        },
        distinct: ['userId']
      })

      downloadTrends.push({
        date: date.toISOString().split('T')[0],
        downloads: dayDownloads,
        uniqueUsers: dayUniqueUsers.length
      })
    }

    const stats = {
      totalDownloads,
      dailyDownloads,
      weeklyDownloads,
      monthlyDownloads,
      uniqueUsers,
      averageDownloadsPerUser: Number(averageDownloadsPerUser.toFixed(2)),
      topSoftware: validTopSoftware,
      downloadTrends,
      categoryStats: categoryStatsArray
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching download analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch download analytics' },
      { status: 500 }
    )
  }
}

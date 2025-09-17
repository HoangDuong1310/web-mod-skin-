import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, subDays, format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30d'
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    // Calculate date range
    let startDate: Date
    let endDate: Date = new Date()

    if (fromParam && toParam) {
      startDate = new Date(fromParam)
      endDate = new Date(toParam)
    } else {
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90
      startDate = subDays(endDate, days)
    }

    // Calculate previous period for comparison
    const periodLength = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const previousStartDate = subDays(startDate, periodLength)
    const previousEndDate = startDate

    // Get current period data
    const [currentSkins, currentDownloads] = await Promise.all([
      // Total skins in current period
      prisma.customSkin.count({
        where: {
          status: 'APPROVED',
          createdAt: {
            gte: startOfDay(startDate),
            lte: endOfDay(endDate)
          }
        }
      }),
      
      // Total downloads in current period (sum of downloadCount field)
      prisma.customSkin.aggregate({
        _sum: {
          downloadCount: true
        },
        where: {
          status: 'APPROVED',
          createdAt: {
            gte: startOfDay(startDate),
            lte: endOfDay(endDate)
          }
        }
      })
    ])
    
    // Calculate estimated views and ratings
    const currentViews = Math.floor((currentDownloads._sum.downloadCount || 0) * 2.5)
    const currentRatings = { _avg: { rating: 4.3 } } // Mock rating

    // Get previous period data for comparison
    const [previousSkins, previousDownloads] = await Promise.all([
      prisma.customSkin.count({
        where: {
          status: 'APPROVED',
          createdAt: {
            gte: startOfDay(previousStartDate),
            lte: endOfDay(previousEndDate)
          }
        }
      }),
      
      prisma.customSkin.aggregate({
        _sum: {
          downloadCount: true
        },
        where: {
          status: 'APPROVED',
          createdAt: {
            gte: startOfDay(previousStartDate),
            lte: endOfDay(previousEndDate)
          }
        }
      })
    ])
    
    const previousViews = Math.floor((previousDownloads._sum.downloadCount || 0) * 2.5)
    const previousRatings = { _avg: { rating: 4.2 } } // Mock rating

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    // Get skins by category
    const skinsByCategory = await prisma.customSkin.groupBy({
      by: ['categoryId'],
      _count: {
        id: true
      },
      where: {
        status: 'APPROVED',
        createdAt: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate)
        }
      }
    })

    // Get category names
    const categories = await prisma.skinCategory.findMany({
      where: {
        id: {
          in: skinsByCategory.map(item => item.categoryId).filter(Boolean) as string[]
        }
      }
    })

    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.id] = cat.name
      return acc
    }, {} as Record<string, string>)

    const categoryColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']
    
    const skinsByCategoryData = skinsByCategory.map((item, index) => ({
      name: item.categoryId ? categoryMap[item.categoryId] || 'Unknown' : 'Uncategorized',
      value: item._count.id,
      color: categoryColors[index % categoryColors.length]
    }))

    // Get skins by champion
    const skinsByChampion = await prisma.customSkin.groupBy({
      by: ['championId'],
      _count: {
        id: true
      },
      where: {
        status: 'APPROVED',
        createdAt: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate)
        }
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })

    // Get champion names
    const champions = await prisma.champion.findMany({
      where: {
        id: {
          in: skinsByChampion.map(item => item.championId).filter(Boolean) as number[]
        }
      }
    })

    const championMap = champions.reduce((acc, champ) => {
      acc[champ.id] = champ.name
      return acc
    }, {} as Record<number, string>)

    const skinsByChampionData = skinsByChampion.map(item => ({
      name: item.championId ? championMap[item.championId] || 'Unknown' : 'No Champion',
      value: item._count.id
    }))

    // Get daily downloads and views trend
    const dailyStats = []
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayStart = startOfDay(new Date(d))
      const dayEnd = endOfDay(new Date(d))
      
      const downloads = await prisma.customSkin.aggregate({
        _sum: {
          downloadCount: true
        },
        where: {
          status: 'APPROVED',
          createdAt: {
            lte: dayEnd
          }
        }
      })
      
      const downloadCount = downloads._sum.downloadCount || 0
      const viewCount = Math.floor(downloadCount * 2.5)
      
      dailyStats.push({
        date: format(new Date(d), 'yyyy-MM-dd'),
        downloads: downloadCount,
        views: viewCount
      })
    }

    // Mock rating distribution (since we don't have rating table)
    const totalApprovedSkins = await prisma.customSkin.count({
      where: { status: 'APPROVED' }
    })
    
    const ratingDistributionData = [
      { rating: '5 sao', count: Math.floor(totalApprovedSkins * 0.45) },
      { rating: '4 sao', count: Math.floor(totalApprovedSkins * 0.30) },
      { rating: '3 sao', count: Math.floor(totalApprovedSkins * 0.15) },
      { rating: '2 sao', count: Math.floor(totalApprovedSkins * 0.07) },
      { rating: '1 sao', count: Math.floor(totalApprovedSkins * 0.03) }
    ]

    // Get top skins
    const topSkins = await prisma.customSkin.findMany({
      where: {
        status: 'APPROVED',
        createdAt: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate)
        }
      },
      include: {
        champion: true
      },
      orderBy: {
        downloadCount: 'desc'
      },
      take: 10
    })

    const topSkinsData = topSkins.map(skin => {
      return {
        id: skin.id,
        name: skin.name,
        champion: skin.champion?.name || 'Unknown',
        downloads: skin.downloadCount || 0,
        views: Math.floor((skin.downloadCount || 0) * 2.5),
        rating: 4 + Math.random() // Mock rating between 4-5
      }
    })

    // Prepare response data
    const analyticsData = {
      overview: {
        totalSkins: currentSkins,
        totalDownloads: currentDownloads._sum.downloadCount || 0,
        totalViews: currentViews,
        averageRating: currentRatings._avg.rating || 0,
        trendsData: {
          skins: {
            current: currentSkins,
            previous: previousSkins,
            change: calculateChange(currentSkins, previousSkins)
          },
          downloads: {
            current: currentDownloads._sum.downloadCount || 0,
            previous: previousDownloads._sum.downloadCount || 0,
            change: calculateChange(
              currentDownloads._sum.downloadCount || 0,
              previousDownloads._sum.downloadCount || 0
            )
          },
          views: {
            current: currentViews,
            previous: previousViews,
            change: calculateChange(currentViews, previousViews)
          },
          rating: {
            current: currentRatings._avg.rating || 0,
            previous: previousRatings._avg.rating || 0,
            change: calculateChange(
              currentRatings._avg.rating || 0,
              previousRatings._avg.rating || 0
            )
          }
        }
      },
      chartData: {
        skinsByCategory: skinsByCategoryData,
        skinsByChampion: skinsByChampionData,
        downloadsTrend: dailyStats,
        ratingDistribution: ratingDistributionData,
        topSkins: topSkinsData
      },
      timeData: {
        dailyStats,
        monthlyStats: [] // Can be implemented later if needed
      }
    }

    return NextResponse.json(analyticsData)
    
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
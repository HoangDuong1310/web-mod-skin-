import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's download history
    const downloads = await prisma.download.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            price: true,
            images: true,
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
            reviews: {
              where: {
                isVisible: true,
                deletedAt: null,
              },
              select: {
                rating: true,
              },
            },
            _count: {
              select: {
                reviews: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to recent 50 downloads
    })

    // Transform data for frontend
    const downloadHistory = downloads.map(download => ({
      id: download.id,
      softwareName: download.product.title,
      softwareSlug: download.product.slug,
      softwareId: download.product.id,
      category: download.product.category?.name || 'Unknown',
      downloadDate: download.createdAt.toISOString(),
      version: '1.0.0', // You can add version field to product model later
      size: '50 MB', // You can add file size field later
      averageRating: download.product.reviews.length > 0
        ? download.product.reviews.reduce((sum, r) => sum + r.rating, 0) / download.product.reviews.length
        : 0,
      totalReviews: download.product._count.reviews,
    }))

    // Calculate stats
    const stats = {
      totalDownloads: downloadHistory.length,
      uniqueSoftware: new Set(downloadHistory.map(d => d.softwareId)).size,
      lastDownload: downloadHistory.length > 0 
        ? downloadHistory[0].downloadDate 
        : '',
      favoriteCategory: downloadHistory.length > 0
        ? (() => {
            const categoryCount = downloadHistory.reduce((acc, download) => {
              acc[download.category] = (acc[download.category] || 0) + 1
              return acc
            }, {} as Record<string, number>)
            
            const sortedCategories = Object.entries(categoryCount)
              .sort((a, b) => b[1] - a[1])
            
            return sortedCategories[0]?.[0] || 'None'
          })()
        : 'None'
    }

    return NextResponse.json({
      downloads: downloadHistory,
      stats,
    })

  } catch (error) {
    console.error('Error fetching user downloads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

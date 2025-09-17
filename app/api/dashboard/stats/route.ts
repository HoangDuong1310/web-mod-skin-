import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canAccessDashboard } from '@/lib/auth-utils'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !canAccessDashboard(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get date ranges
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)
    
    const lastMonth = new Date(today)
    lastMonth.setMonth(lastMonth.getMonth() - 1)

    // Fetch all statistics in parallel
    const [
      // User statistics
      totalUsers,
      newUsersToday,
      newUsersLastWeek,
      newUsersLastMonth,
      usersByRole,
      
      // Product statistics
      totalProducts,
      publishedProducts,
      totalDownloads,
      downloadsToday,
      downloadsLastWeek,
      downloadsLastMonth,
      
      // Review statistics
      totalReviews,
      averageRating,
      reviewsLastWeek,
      
      // Donation statistics
      totalDonations,
      completedDonations,
      donationAmount,
      donationsToday,
      activeGoals,
      
      // Custom Skins statistics
      totalCustomSkins,
      approvedSkins,
      skinDownloads,
      pendingSubmissions,
      
      // Recent activities
      recentDownloads,
      recentReviews,
      recentDonations,
      recentSubmissions,
      
      // Top content
      topProducts,
      topSkins,
      
      // Blog/Post statistics
      totalPosts,
      publishedPosts,
    ] = await Promise.all([
      // User counts
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { createdAt: { gte: today }, deletedAt: null } }),
      prisma.user.count({ where: { createdAt: { gte: lastWeek }, deletedAt: null } }),
      prisma.user.count({ where: { createdAt: { gte: lastMonth }, deletedAt: null } }),
      prisma.user.groupBy({
        by: ['role'],
        where: { deletedAt: null },
        _count: { id: true }
      }),
      
      // Product counts
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.product.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
      prisma.download.count(),
      prisma.download.count({ where: { createdAt: { gte: today } } }),
      prisma.download.count({ where: { createdAt: { gte: lastWeek } } }),
      prisma.download.count({ where: { createdAt: { gte: lastMonth } } }),
      
      // Review counts
      prisma.review.count({ where: { isVisible: true, deletedAt: null } }),
      prisma.review.aggregate({
        where: { isVisible: true, deletedAt: null },
        _avg: { rating: true }
      }),
      prisma.review.count({ 
        where: { 
          createdAt: { gte: lastWeek },
          isVisible: true,
          deletedAt: null
        }
      }),
      
      // Donation statistics
      prisma.donation.count(),
      prisma.donation.count({ where: { status: 'COMPLETED' } }),
      prisma.donation.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true }
      }),
      prisma.donation.count({ 
        where: { 
          status: 'COMPLETED',
          createdAt: { gte: today }
        }
      }),
      prisma.donationGoal.count({ where: { isActive: true } }),
      
      // Custom Skin statistics
      prisma.customSkin.count({ where: { deletedAt: null } }),
      prisma.customSkin.count({ where: { status: 'APPROVED', deletedAt: null } }),
      prisma.skinDownload.count(),
      prisma.skinSubmission.count({ where: { status: 'PENDING', deletedAt: null } }),
      
      // Recent activities (limit to 5 each)
      prisma.download.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { title: true } },
          user: { select: { name: true, email: true } }
        }
      }),
      prisma.review.findMany({
        where: { isVisible: true, deletedAt: null },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { title: true } },
          user: { select: { name: true } }
        }
      }),
      prisma.donation.findMany({
        where: { status: 'COMPLETED' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true } }
        }
      }),
      prisma.skinSubmission.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          submitter: { select: { name: true } },
          champion: { select: { name: true } }
        }
      }),
      
      // Top content
      prisma.product.findMany({
        where: { status: 'PUBLISHED', deletedAt: null },
        take: 5,
        orderBy: [
          { downloads: { _count: 'desc' } },
          { averageRating: 'desc' }
        ],
        select: {
          id: true,
          title: true,
          slug: true,
          _count: { select: { downloads: true } },
          averageRating: true,
          totalReviews: true
        }
      }),
      prisma.customSkin.findMany({
        where: { status: 'APPROVED', deletedAt: null },
        take: 5,
        orderBy: { downloadCount: 'desc' },
        select: {
          id: true,
          name: true,
          downloadCount: true,
          champion: { select: { name: true } },
          author: { select: { name: true } }
        }
      }),
      
      // Blog/Post statistics
      prisma.post.count({ where: { deletedAt: null } }),
      prisma.post.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
    ])

    // Calculate growth percentages
    const userGrowthRate = lastMonth.getTime() > 0 && newUsersLastMonth > 0 
      ? ((newUsersLastWeek / newUsersLastMonth) * 100).toFixed(1)
      : '0'
      
    const downloadGrowthRate = downloadsLastMonth > 0 
      ? (((downloadsLastWeek - (downloadsLastMonth - downloadsLastWeek)) / (downloadsLastMonth - downloadsLastWeek)) * 100).toFixed(1)
      : '0'

    // Get user growth data for chart (last 30 days)
    const userGrowthData = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM users
      WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND deletedAt IS NULL
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    ` as Array<{ date: Date; count: bigint }>

    // Get download trend data for chart (last 30 days)
    const downloadTrendData = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM downloads
      WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    ` as Array<{ date: Date; count: bigint }>

    // Get donation trend data for chart (last 30 days)
    const donationTrendData = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as totalAmount
      FROM donations
      WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND status = 'COMPLETED'
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    ` as Array<{ date: Date; count: bigint; totalAmount: number }>

    const stats = {
      // Overview stats
      overview: {
        totalUsers,
        newUsersToday,
        newUsersLastWeek,
        newUsersLastMonth,
        userGrowthRate,
        usersByRole: usersByRole.map(item => ({
          role: item.role,
          count: item._count.id
        })),
      },
      
      // Product stats
      products: {
        total: totalProducts,
        published: publishedProducts,
        totalDownloads,
        downloadsToday,
        downloadsLastWeek,
        downloadsLastMonth,
        downloadGrowthRate,
      },
      
      // Review stats
      reviews: {
        total: totalReviews,
        averageRating: averageRating._avg.rating || 0,
        lastWeek: reviewsLastWeek,
      },
      
      // Donation stats
      donations: {
        total: totalDonations,
        completed: completedDonations,
        totalAmount: donationAmount._sum.amount || 0,
        todayCount: donationsToday,
        activeGoals,
      },
      
      // Custom skins stats
      customSkins: {
        total: totalCustomSkins,
        approved: approvedSkins,
        downloads: skinDownloads,
        pendingSubmissions,
      },
      
      // Blog stats
      blog: {
        total: totalPosts,
        published: publishedPosts,
      },
      
      // Recent activities
      recentActivities: {
        downloads: recentDownloads.map(d => ({
          id: d.id,
          productTitle: d.product.title,
          userName: d.user?.name || 'Guest',
          userEmail: d.user?.email || 'N/A',
          createdAt: d.createdAt,
        })),
        reviews: recentReviews.map(r => ({
          id: r.id,
          productTitle: r.product.title,
          userName: r.user?.name || r.guestName || 'Guest',
          rating: r.rating,
          title: r.title,
          createdAt: r.createdAt,
        })),
        donations: recentDonations.map(d => ({
          id: d.id,
          amount: d.amount,
          currency: d.currency,
          donorName: d.isAnonymous ? 'Anonymous' : (d.user?.name || d.donorName || 'Guest'),
          createdAt: d.createdAt,
        })),
        submissions: recentSubmissions.map(s => ({
          id: s.id,
          name: s.name,
          championName: s.champion.name,
          submitterName: s.submitter.name || 'Unknown',
          status: s.status,
          createdAt: s.createdAt,
        })),
      },
      
      // Top content
      topContent: {
        products: topProducts.map(p => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          downloads: p._count.downloads,
          rating: p.averageRating,
          reviews: p.totalReviews,
        })),
        skins: topSkins.map(s => ({
          id: s.id,
          name: s.name,
          downloads: s.downloadCount,
          championName: s.champion.name,
          authorName: s.author?.name || 'Unknown',
        })),
      },
      
      // Chart data
      charts: {
        userGrowth: userGrowthData.map(item => ({
          date: item.date,
          count: Number(item.count),
        })),
        downloadTrend: downloadTrendData.map(item => ({
          date: item.date,
          count: Number(item.count),
        })),
        donationTrend: donationTrendData.map(item => ({
          date: item.date,
          count: Number(item.count),
          amount: Number(item.totalAmount),
        })),
      },
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}

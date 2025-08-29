import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SoftwareTable } from '@/components/dashboard/software-table'
import { DashboardStats } from '@/components/dashboard/stats'
import { RecentDownloads } from '@/components/dashboard/recent-downloads'
import { ReviewsOverview } from '@/components/dashboard/reviews-overview'
import { SoftwareManagement } from '@/components/dashboard/software-management'
import { UserManagement } from '@/components/dashboard/user-management'

export const metadata: Metadata = {
  title: 'Admin Dashboard - Software Download Platform',
  description: 'Manage software downloads, reviews and view analytics',
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return null
  }

  // Check if user is admin
  if (session.user.role !== 'ADMIN') {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    )
  }

  try {
    // Fetch dashboard data in parallel for software download platform
    const [
      softwareCount,
      totalDownloads,
      recentSoftware,
      recentReviews,
      reviewStats,
    ] = await Promise.all([
      // Count published software
      prisma.product.count({
        where: { deletedAt: null, status: 'PUBLISHED' }
      }),
      // Sum all downloads (using stock field as download count for now)
      prisma.product.aggregate({
        where: { deletedAt: null },
        _sum: { stock: true }
      }),
      // Recent software with categories and review counts
      prisma.product.findMany({
        where: { deletedAt: null },
        include: {
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              reviews: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Recent reviews
      prisma.review.findMany({
        where: { deletedAt: null, isVisible: true },
        include: {
          product: {
            select: {
              title: true,
              slug: true,
            },
          },
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // Review statistics
      prisma.review.aggregate({
        where: { deletedAt: null, isVisible: true },
        _avg: { rating: true },
        _count: { id: true },
      }),
    ])

    // Calculate stats for software platform
    const stats = {
      totalSoftware: softwareCount,
      totalDownloads: totalDownloads._sum.stock || 0,
      totalReviews: reviewStats._count.id,
      averageRating: reviewStats._avg.rating || 0,
    }

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {session.user.name || 'Admin'}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your software platform today.
          </p>
        </div>

        {/* Dashboard Statistics */}
        <DashboardStats stats={stats} />

        {/* Reviews Overview */}
        <ReviewsOverview />

        {/* Software Management */}
        <SoftwareManagement software={recentSoftware.map(software => ({
          id: software.id,
          title: software.title,
          slug: software.slug,
          description: software.description,
          downloads: software.stock || 0, // Using stock as download count
          status: software.status as 'PUBLISHED' | 'DRAFT' | 'ARCHIVED',
          rating: Number(software.averageRating) || 0,
          reviewCount: software._count.reviews,
          category: software.category,
          createdAt: software.createdAt.toISOString(),
          updatedAt: software.updatedAt.toISOString(),
        }))} />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Software */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Software</CardTitle>
              <CardDescription>
                Latest software added to your platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SoftwareTable software={recentSoftware} />
            </CardContent>
          </Card>

          {/* Recent Downloads/Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
              <CardDescription>
                Latest reviews from users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentDownloads reviews={recentReviews} />
            </CardContent>
          </Card>
        </div>

        {/* User Management Section */}
        <div className="mt-6">
          <UserManagement />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Dashboard error:', error)
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Something went wrong</h2>
          <p className="text-muted-foreground">Failed to load dashboard data. Please try again later.</p>
        </div>
      </div>
    )
  }
}

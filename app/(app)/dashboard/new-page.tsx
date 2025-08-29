import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardStats } from '@/components/dashboard/stats'
import { UserManagement } from '@/components/dashboard/user-management'
import SoftwareManagement from '@/components/dashboard/software-mgmt'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/')
  }

  // Get real stats from database  
  const [totalSoftware, totalDownloads, totalReviews, averageRatingResult] = await Promise.all([
    prisma.product.count({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
      },
    }),
    prisma.download.count(),
    prisma.review.count({
      where: {
        isVisible: true,
        deletedAt: null,
      },
    }),
    prisma.review.aggregate({
      where: {
        isVisible: true,
        deletedAt: null,
      },
      _avg: {
        rating: true,
      },
    }),
  ])

  const stats = {
    totalSoftware,
    totalDownloads,
    totalReviews,
    averageRating: averageRatingResult._avg.rating || 0,
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to your admin dashboard
        </p>
      </div>
      
      <DashboardStats stats={stats} />
      
      <div className="grid gap-8">
        <SoftwareManagement />
        <UserManagement />
        
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Recent downloads and user activity will be displayed here.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

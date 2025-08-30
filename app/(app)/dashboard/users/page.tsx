import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Plus, 
  Edit, 
  Shield,
  User
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { UsersClient } from './users-client'

export default async function UsersManagementPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  // User management is ADMIN only
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Get users with stats
  const [users, userStats, userActivity] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: {
            downloads: true,
            reviews: true,
            posts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    
    prisma.user.groupBy({
      by: ['role'],
      where: { deletedAt: null },
      _count: { id: true },
    }),

    // Get recent user activity
    prisma.download.findMany({
      where: {
        userId: { not: null },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  const stats = {
    total: users.length,
    admin: userStats.find(s => s.role === 'ADMIN')?._count.id || 0,
    staff: userStats.find(s => s.role === 'STAFF')?._count.id || 0,
    user: userStats.find(s => s.role === 'USER')?._count.id || 0,
  }



  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/users/new">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.admin}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.staff}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.user}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Users Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsersClient users={users} currentUserId={session.user.id} />
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest user downloads and activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userActivity.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No recent activity
                  </p>
                ) : (
                  userActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 text-sm">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1 space-y-1">
                        <p>
                          <span className="font-medium">
                            {activity.user?.name || 'Anonymous'}
                          </span>
                          {' downloaded '}
                          <Link 
                            href={`/products/${activity.product.slug}`}
                            className="text-primary hover:underline"
                          >
                            {activity.product.title}
                          </Link>
                        </p>
                        <p className="text-muted-foreground">
                          {formatDate(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

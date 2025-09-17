'use client'

import { useEffect, useState } from 'react'
import { EnhancedStats } from '@/components/dashboard/enhanced-stats'
import { DashboardCharts } from '@/components/dashboard/dashboard-charts'
import { RecentActivities } from '@/components/dashboard/recent-activities'
import { SystemInfo } from '@/components/dashboard/system-info'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export function DashboardClient() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        setLoading(true)
        const response = await fetch('/api/dashboard/stats')
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard statistics')
        }
        
        const data = await response.json()
        setStats(data)
      } catch (err: any) {
        setError(err.message || 'An error occurred')
        console.error('Error fetching dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardStats, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard statistics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Statistics Cards */}
      <EnhancedStats stats={stats} />
      
      {/* Charts Section */}
      <DashboardCharts 
        charts={stats?.charts || {}} 
        usersByRole={stats?.overview?.usersByRole || []}
      />
      
      {/* Recent Activities and Top Content */}
      <RecentActivities 
        activities={stats?.recentActivities || {}}
        topContent={stats?.topContent || {}}
      />
      
      {/* System Info and Quick Actions Row */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* System Information */}
        <SystemInfo className="lg:col-span-1" />
        
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
            <a
              href="/dashboard/products/new"
              className="flex flex-col items-center justify-center p-4 rounded-lg border hover:bg-muted transition-colors text-center"
            >
              <span className="text-2xl mb-2">📦</span>
              <span className="text-sm font-medium">Add Product</span>
            </a>
            <a
              href="/dashboard/posts/new"
              className="flex flex-col items-center justify-center p-4 rounded-lg border hover:bg-muted transition-colors text-center"
            >
              <span className="text-2xl mb-2">📝</span>
              <span className="text-sm font-medium">New Post</span>
            </a>
            <a
              href="/dashboard/users"
              className="flex flex-col items-center justify-center p-4 rounded-lg border hover:bg-muted transition-colors text-center"
            >
              <span className="text-2xl mb-2">👥</span>
              <span className="text-sm font-medium">Manage Users</span>
            </a>
            <a
              href="/dashboard/custom-skins/submissions"
              className="flex flex-col items-center justify-center p-4 rounded-lg border hover:bg-muted transition-colors text-center"
            >
              <span className="text-2xl mb-2">🎨</span>
              <span className="text-sm font-medium">Review Skins</span>
            </a>
            <a
              href="/dashboard/settings"
              className="flex flex-col items-center justify-center p-4 rounded-lg border hover:bg-muted transition-colors text-center"
            >
              <span className="text-2xl mb-2">⚙️</span>
              <span className="text-sm font-medium">Settings</span>
            </a>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

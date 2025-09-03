'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NotificationStats } from '@/hooks/use-notifications'
import { Bell, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'

interface NotificationStatsProps {
  stats: NotificationStats
  isLoading?: boolean
}

export function NotificationStatsComponent({ stats, isLoading }: NotificationStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              </CardTitle>
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-12 bg-muted animate-pulse rounded mb-1" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const typeIcons = {
    info: <Info className="h-4 w-4 text-blue-600" />,
    success: <CheckCircle className="h-4 w-4 text-green-600" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
    error: <AlertCircle className="h-4 w-4 text-red-600" />,
  }

  const typeColors = {
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200',
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Badge variant={stats.unread > 0 ? 'destructive' : 'secondary'}>
              {stats.unread}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unread}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 
                ? `${Math.round((stats.unread / stats.total) * 100)}% of total`
                : 'No notifications'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <div className="text-xs text-muted-foreground">24h</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground">
              {stats.today > 0 ? 'New notifications' : 'No new notifications'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <div className="text-xs text-muted-foreground">7d</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground">
              Weekly activity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Breakdown by notification type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div
                key={type}
                className={`p-4 rounded-lg border ${typeColors[type as keyof typeof typeColors]}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {typeIcons[type as keyof typeof typeIcons]}
                    <span className="font-medium capitalize">{type}</span>
                  </div>
                  <Badge variant="outline">{count}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {stats.total > 0 
                    ? `${Math.round((count / stats.total) * 100)}% of total`
                    : 'No notifications'
                  }
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {stats.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span>Read Rate:</span>
                <span className="font-medium">
                  {Math.round(((stats.total - stats.unread) / stats.total) * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Most Common Type:</span>
                <span className="font-medium capitalize">
                  {Object.entries(stats.byType).reduce((a, b) => 
                    stats.byType[a[0] as keyof typeof stats.byType] > stats.byType[b[0] as keyof typeof stats.byType] ? a : b
                  )[0]}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Daily Average:</span>
                <span className="font-medium">
                  {Math.round(stats.thisWeek / 7)} notifications
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
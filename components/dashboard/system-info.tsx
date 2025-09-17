'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Server, 
  Database, 
  HardDrive, 
  Activity,
  Shield,
  Globe,
  Zap,
  Clock
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface SystemInfoProps {
  className?: string
}

export function SystemInfo({ className }: SystemInfoProps) {
  const [systemStatus, setSystemStatus] = useState({
    server: 'Operational',
    database: 'Connected',
    storage: 75, // percentage used
    uptime: '15 days, 3 hours',
    lastBackup: '2 hours ago',
    ssl: 'Valid',
    cdn: 'Active',
    cacheHit: 92,
  })

  // Mock real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStatus(prev => ({
        ...prev,
        cacheHit: Math.floor(Math.random() * 10) + 90,
      }))
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const statusItems = [
    {
      label: 'Server Status',
      value: systemStatus.server,
      icon: Server,
      status: 'success' as const,
    },
    {
      label: 'Database',
      value: systemStatus.database,
      icon: Database,
      status: 'success' as const,
    },
    {
      label: 'SSL Certificate',
      value: systemStatus.ssl,
      icon: Shield,
      status: 'success' as const,
    },
    {
      label: 'CDN',
      value: systemStatus.cdn,
      icon: Globe,
      status: 'success' as const,
    },
  ]

  const getStatusColor = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>System Information</CardTitle>
        <CardDescription>Monitor server and infrastructure status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-4">
          {statusItems.map((item) => (
            <div key={item.label} className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <item.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.label}</p>
                <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                  {item.value}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Storage Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Storage Usage</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {systemStatus.storage}% used
            </span>
          </div>
          <Progress value={systemStatus.storage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            75GB of 100GB used
          </p>
        </div>

        {/* Cache Performance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Cache Hit Rate</span>
            </div>
            <span className="text-sm font-bold text-green-600">
              {systemStatus.cacheHit}%
            </span>
          </div>
          <Progress value={systemStatus.cacheHit} className="h-2" />
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 gap-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Uptime</span>
            </div>
            <span className="text-sm font-medium">{systemStatus.uptime}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Last Backup</span>
            </div>
            <span className="text-sm font-medium">{systemStatus.lastBackup}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

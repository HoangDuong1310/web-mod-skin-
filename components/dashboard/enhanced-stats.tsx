'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  Download, 
  MessageSquare, 
  Star, 
  Package,
  Heart,
  Image,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatItem {
  title: string
  value: string | number
  icon: any
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  suffix?: string
  className?: string
}

interface EnhancedStatsProps {
  stats: any
}

export function EnhancedStats({ stats }: EnhancedStatsProps) {
  if (!stats) return null
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toLocaleString()
  }

  const formatCurrency = (amount: any) => {
    const num = parseFloat(amount || 0)
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  }

  const statItems: StatItem[] = [
    // User Statistics
    {
      title: 'Total Users',
      value: formatNumber(stats.overview?.totalUsers || 0),
      icon: Users,
      description: `+${stats.overview?.newUsersToday || 0} today`,
      trend: stats.overview?.userGrowthRate > 0 ? {
        value: parseFloat(stats.overview.userGrowthRate),
        isPositive: true
      } : undefined,
      className: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    },
    {
      title: 'Total Products',
      value: formatNumber(stats.products?.total || 0),
      icon: Package,
      description: `${stats.products?.published || 0} published`,
      className: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    },
    {
      title: 'Total Downloads',
      value: formatNumber(stats.products?.totalDownloads || 0),
      icon: Download,
      description: `+${stats.products?.downloadsToday || 0} today`,
      trend: stats.products?.downloadGrowthRate > 0 ? {
        value: parseFloat(stats.products.downloadGrowthRate),
        isPositive: true
      } : undefined,
      className: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    },
    {
      title: 'Total Reviews',
      value: formatNumber(stats.reviews?.total || 0),
      icon: MessageSquare,
      description: `${stats.reviews?.lastWeek || 0} this week`,
      className: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    },
    {
      title: 'Average Rating',
      value: Number(stats.reviews?.averageRating || 0).toFixed(1),
      icon: Star,
      suffix: '⭐',
      description: 'Overall rating',
      className: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    },
    {
      title: 'Total Donations',
      value: formatCurrency(stats.donations?.totalAmount || 0),
      icon: Heart,
      description: `${stats.donations?.completed || 0} completed`,
      className: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800',
    },
    {
      title: 'Custom Skins',
      value: formatNumber(stats.customSkins?.total || 0),
      icon: Image,
      description: `${stats.customSkins?.pendingSubmissions || 0} pending`,
      className: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
    },
    {
      title: 'Blog Posts',
      value: formatNumber(stats.blog?.total || 0),
      icon: FileText,
      description: `${stats.blog?.published || 0} published`,
      className: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800',
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => (
        <Card 
          key={item.title} 
          className={cn(
            "hover:shadow-lg transition-all duration-200 border-2",
            item.className
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate pr-2">
              {item.title}
            </CardTitle>
            <div className="relative">
              <item.icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              {item.trend && (
                <div className={cn(
                  "absolute -top-1 -right-1 rounded-full p-0.5",
                  item.trend.isPositive ? "bg-green-500" : "bg-red-500"
                )}>
                  {item.trend.isPositive ? (
                    <TrendingUp className="h-2 w-2 text-white" />
                  ) : (
                    <TrendingDown className="h-2 w-2 text-white" />
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {item.value}{item.suffix || ''}
            </div>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {item.description}
              </p>
            )}
            {item.trend && (
              <div className={cn(
                "inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-1 rounded-full",
                item.trend.isPositive 
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              )}>
                {item.trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(item.trend.value)}%
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

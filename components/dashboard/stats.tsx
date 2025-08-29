import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { Package, Download, MessageSquare, Star } from 'lucide-react'

interface DashboardStatsProps {
  stats: {
    totalSoftware: number
    totalDownloads: number
    totalReviews: number
    averageRating: number
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statItems = [
    {
      title: 'Total Software',
      value: stats.totalSoftware.toLocaleString(),
      icon: Package,
      description: 'Published software on platform',
    },
    {
      title: 'Total Downloads',
      value: stats.totalDownloads.toLocaleString(),
      icon: Download,
      description: 'Downloads across all software',
    },
    {
      title: 'Total Reviews',
      value: stats.totalReviews.toLocaleString(),
      icon: MessageSquare,
      description: 'User reviews and ratings',
    },
    {
      title: 'Average Rating',
      value: Number(stats.averageRating).toFixed(1),
      icon: Star,
      description: 'Average user rating',
      suffix: '⭐',
    },
  ]

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {item.value}{item.suffix || ''}
            </div>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}


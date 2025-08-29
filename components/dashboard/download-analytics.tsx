'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Download, 
  TrendingUp, 
  Users, 
  Calendar, 
  Star,
  BarChart3,
  Package,
  Eye
} from 'lucide-react'

interface DownloadStats {
  totalDownloads: number
  dailyDownloads: number
  weeklyDownloads: number
  monthlyDownloads: number
  uniqueUsers: number
  averageDownloadsPerUser: number
  topSoftware: Array<{
    id: string
    name: string
    slug: string
    downloads: number
    category: string
    averageRating: number
    totalReviews: number
    lastDownload: string
  }>
  downloadTrends: Array<{
    date: string
    downloads: number
    uniqueUsers: number
  }>
  categoryStats: Array<{
    category: string
    downloads: number
    percentage: number
  }>
}

interface DownloadRecord {
  id: string
  softwareName: string
  userName: string
  userEmail: string
  downloadDate: string
  category: string
  rating: number | null
}

export default function DownloadAnalytics() {
  const [stats, setStats] = useState<DownloadStats>({
    totalDownloads: 0,
    dailyDownloads: 0,
    weeklyDownloads: 0,
    monthlyDownloads: 0,
    uniqueUsers: 0,
    averageDownloadsPerUser: 0,
    topSoftware: [],
    downloadTrends: [],
    categoryStats: []
  })
  const [recentDownloads, setRecentDownloads] = useState<DownloadRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      // Fetch download statistics
      const statsResponse = await fetch(`/api/admin/analytics/downloads?range=${timeRange}`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Fetch recent downloads
      const downloadsResponse = await fetch('/api/admin/analytics/recent-downloads?limit=20')
      if (downloadsResponse.ok) {
        const downloadsData = await downloadsResponse.json()
        setRecentDownloads(downloadsData.downloads || [])
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num)
  }

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 30) return 'text-green-600'
    if (percentage >= 20) return 'text-blue-600'
    if (percentage >= 10) return 'text-yellow-600'
    return 'text-gray-600'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Download Analytics</h1>
          <p className="text-muted-foreground">Track software downloads and user engagement</p>
        </div>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 3 months</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalDownloads)}</div>
            <p className="text-xs text-muted-foreground">
              All time downloads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Downloads</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatNumber(stats.dailyDownloads)}</div>
            <p className="text-xs text-muted-foreground">
              Downloads today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatNumber(stats.uniqueUsers)}</div>
            <p className="text-xs text-muted-foreground">
              Active downloaders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Downloads/User</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.averageDownloadsPerUser.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Downloads per user
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Top Software */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Downloaded Software */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Most Downloaded Software
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading top software...
              </div>
            ) : stats.topSoftware.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No download data available
              </div>
            ) : (
              <div className="space-y-4">
                {stats.topSoftware.map((software, index) => (
                  <div key={software.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{software.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Badge variant="outline">{software.category}</Badge>
                          {software.totalReviews > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                              <span>{Number(software.averageRating).toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{formatNumber(software.downloads)}</div>
                      <div className="text-sm text-muted-foreground">downloads</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Downloads by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading category stats...
              </div>
            ) : stats.categoryStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No category data available
              </div>
            ) : (
              <div className="space-y-4">
                {stats.categoryStats.map((category) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category.category}</span>
                      <span className={`font-bold ${getPercentageColor(category.percentage)}`}>
                        {category.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatNumber(category.downloads)} downloads
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Downloads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Downloads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Software</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Download Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      Loading recent downloads...
                    </TableCell>
                  </TableRow>
                ) : recentDownloads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      No recent downloads found
                    </TableCell>
                  </TableRow>
                ) : (
                  recentDownloads.map((download) => (
                    <TableRow key={download.id}>
                      <TableCell>
                        <div className="font-medium">{download.softwareName}</div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{download.userName}</div>
                          <div className="text-sm text-muted-foreground">{download.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{download.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {download.rating ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            <span>{download.rating}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not rated</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(download.downloadDate)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

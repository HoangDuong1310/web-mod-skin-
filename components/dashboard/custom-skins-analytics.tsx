'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { toast } from '@/hooks/use-toast'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Download, 
  Eye, 
  Star,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react'
import { addDays, format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

interface AnalyticsData {
  overview: {
    totalSkins: number
    totalDownloads: number
    totalViews: number
    averageRating: number
    trendsData: {
      skins: { current: number; previous: number; change: number }
      downloads: { current: number; previous: number; change: number }
      views: { current: number; previous: number; change: number }
      rating: { current: number; previous: number; change: number }
    }
  }
  chartData: {
    skinsByCategory: Array<{ name: string; value: number; color: string }>
    skinsByChampion: Array<{ name: string; value: number }>
    downloadsTrend: Array<{ date: string; downloads: number; views: number }>
    ratingDistribution: Array<{ rating: string; count: number }>
    topSkins: Array<{
      id: string
      name: string
      champion: string
      downloads: number
      views: number
      rating: number
    }>
  }
  timeData: {
    dailyStats: Array<{ date: string; skins: number; downloads: number; views: number }>
    monthlyStats: Array<{ month: string; skins: number; downloads: number; views: number }>
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function CustomSkinsAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date()
  })
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'custom'>('30d')
  const [refreshing, setRefreshing] = useState(false)

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (timeframe === 'custom' && dateRange?.from && dateRange?.to) {
        params.append('from', dateRange.from.toISOString())
        params.append('to', dateRange.to.toISOString())
      } else {
        params.append('timeframe', timeframe)
      }
      
      const response = await fetch(`/api/admin/custom-skins/analytics?${params}`)
      if (!response.ok) throw new Error('Failed to fetch analytics')
      
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu phân tích',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalytics()
    setRefreshing(false)
    toast({
      title: 'Thành công',
      description: 'Đã cập nhật dữ liệu phân tích'
    })
  }

  useEffect(() => {
    fetchAnalytics()
  }, [timeframe, dateRange])

  // Handle timeframe change
  const handleTimeframeChange = (value: string) => {
    setTimeframe(value as '7d' | '30d' | '90d' | 'custom')
    if (value !== 'custom') {
      const days = value === '7d' ? 7 : value === '30d' ? 30 : 90
      setDateRange({
        from: addDays(new Date(), -days),
        to: new Date()
      })
    }
  }

  const formatTrendValue = (current: number, change: number) => {
    const isPositive = change > 0
    const Icon = isPositive ? TrendingUp : TrendingDown
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600'
    
    return (
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">{current.toLocaleString()}</span>
        <div className={`flex items-center gap-1 ${colorClass}`}>
          <Icon className="h-4 w-4" />
          <span className="text-sm font-medium">
            {Math.abs(change).toFixed(1)}%
          </span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Phân tích Custom Skins</h1>
            <p className="text-muted-foreground">Thống kê và phân tích chi tiết về custom skins</p>
          </div>
        </div>
        <div className="text-center py-8">Đang tải dữ liệu...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Phân tích Custom Skins</h1>
            <p className="text-muted-foreground">Thống kê và phân tích chi tiết về custom skins</p>
          </div>
        </div>
        <div className="text-center py-8 text-muted-foreground">Không có dữ liệu</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Phân tích Custom Skins</h1>
          <p className="text-muted-foreground">Thống kê và phân tích chi tiết về custom skins</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeframe} onValueChange={handleTimeframeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 ngày qua</SelectItem>
              <SelectItem value="30d">30 ngày qua</SelectItem>
              <SelectItem value="90d">90 ngày qua</SelectItem>
              <SelectItem value="custom">Tùy chỉnh</SelectItem>
            </SelectContent>
          </Select>
          
          {/* {timeframe === 'custom' && (
            <DatePickerWithRange
              date={dateRange}
              onDateChange={setDateRange}
            />
          )} */}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Skins</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {formatTrendValue(
              data.overview.totalSkins,
              data.overview.trendsData.skins.change
            )}
            <p className="text-xs text-muted-foreground mt-1">
              So với kỳ trước: {data.overview.trendsData.skins.previous.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Lượt tải</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {formatTrendValue(
              data.overview.totalDownloads,
              data.overview.trendsData.downloads.change
            )}
            <p className="text-xs text-muted-foreground mt-1">
              So với kỳ trước: {data.overview.trendsData.downloads.previous.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Lượt xem</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {formatTrendValue(
              data.overview.totalViews,
              data.overview.trendsData.views.change
            )}
            <p className="text-xs text-muted-foreground mt-1">
              So với kỳ trước: {data.overview.trendsData.views.previous.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đánh giá TB</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {formatTrendValue(
              data.overview.averageRating,
              data.overview.trendsData.rating.change
            )}
            <p className="text-xs text-muted-foreground mt-1">
              So với kỳ trước: {data.overview.trendsData.rating.previous.toFixed(1)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Downloads & Views Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Xu hướng Lượt tải & Lượt xem</CardTitle>
            <CardDescription>Thống kê theo thời gian</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.chartData.downloadsTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: vi })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy', { locale: vi })}
                  formatter={(value: number, name: string) => [
                    value.toLocaleString(),
                    name === 'downloads' ? 'Lượt tải' : 'Lượt xem'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="downloads" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stackId="1" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Skins by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Phân bố theo Danh mục</CardTitle>
            <CardDescription>Số lượng skin theo từng danh mục</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.chartData.skinsByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name} ${entry.percent ? (entry.percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.chartData.skinsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Số lượng']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Champions */}
        <Card>
          <CardHeader>
            <CardTitle>Top Tướng có nhiều Skin nhất</CardTitle>
            <CardDescription>Thống kê theo số lượng skin</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.chartData.skinsByChampion.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Số skin']} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Phân bố Đánh giá</CardTitle>
            <CardDescription>Số lượng skin theo mức đánh giá</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.chartData.ratingDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Số lượng']} />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Skins Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Skins phổ biến nhất</CardTitle>
          <CardDescription>Danh sách skin có lượt tải và đánh giá cao nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.chartData.topSkins.map((skin, index) => (
              <div key={skin.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium">{skin.name}</h4>
                    <p className="text-sm text-muted-foreground">{skin.champion}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-medium">{skin.downloads.toLocaleString()}</div>
                    <div className="text-muted-foreground">Lượt tải</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{skin.views.toLocaleString()}</div>
                    <div className="text-muted-foreground">Lượt xem</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{skin.rating.toFixed(1)}</span>
                    </div>
                    <div className="text-muted-foreground">Đánh giá</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
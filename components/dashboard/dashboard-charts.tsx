'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { format } from 'date-fns'

interface DashboardChartsProps {
  charts: {
    userGrowth: Array<{ date: Date; count: number }>
    downloadTrend: Array<{ date: Date; count: number }>
    donationTrend: Array<{ date: Date; count: number; amount: number }>
  }
  usersByRole?: Array<{ role: string; count: number }>
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function DashboardCharts({ charts, usersByRole }: DashboardChartsProps) {
  if (!charts) return null

  // Format data for charts
  const userGrowthData = charts.userGrowth?.map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    users: item.count
  })) || []

  const downloadTrendData = charts.downloadTrend?.map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    downloads: item.count
  })) || []

  const donationTrendData = charts.donationTrend?.map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    count: item.count,
    amount: item.amount
  })) || []

  const roleData = usersByRole?.map(item => ({
    name: item.role,
    value: item.count
  })) || []

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
          <CardDescription>New user registrations over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorUsers)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Download Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Download Trend</CardTitle>
          <CardDescription>Daily downloads over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={downloadTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="downloads" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Donation Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Donation Analytics</CardTitle>
          <CardDescription>Donation amounts over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={donationTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                />
                <Tooltip 
                  content={({ active, payload, label }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3">
                          <p className="font-medium">{label}</p>
                          <p className="text-sm text-pink-600">
                            Amount: {formatCurrency(payload[0].value)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Count: {payload[0].payload.count}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar 
                  dataKey="amount" 
                  fill="#ec4899"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* User Role Distribution */}
      {roleData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>Users by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

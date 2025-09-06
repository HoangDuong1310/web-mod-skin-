'use client'

import { useState, useEffect } from 'react'
import { Heart, TrendingUp, Users, Target, Calendar, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface DonationStats {
  total: {
    amount: number
    count: number
    average: number
  }
  byStatus: Array<{
    status: string
    _sum: { amount: number }
    _count: number
  }>
  monthlyTrend: Array<{
    month: string
    count: number
    total: number
  }>
}

interface DonationGoal {
  id: string
  title: string
  targetAmount: number
  currentAmount: number
  currency: string
  progressPercentage: number
  donorCount: number
}

export function DonationDashboard() {
  const [stats, setStats] = useState<DonationStats | null>(null)
  const [goals, setGoals] = useState<DonationGoal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, goalsResponse] = await Promise.all([
        fetch('/api/donations/stats'),
        fetch('/api/donations/goals?public=true')
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json()
        setGoals(goalsData.goals)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  const completedDonations = stats?.byStatus.find(s => s.status === 'COMPLETED')
  const pendingDonations = stats?.byStatus.find(s => s.status === 'PENDING')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Donations Overview</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor your fundraising progress and donation statistics
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/donations">
            <Button variant="outline">View All Donations</Button>
          </Link>
          <Link href="/dashboard/donations/goals">
            <Button>Manage Goals</Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(completedDonations?._sum.amount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              +{formatCurrency(stats?.total.average || 0)} average donation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedDonations?._count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingDonations?._count || 0} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.length}</div>
            <p className="text-xs text-muted-foreground">
              {goals.filter(g => Number(g.currentAmount) >= Number(g.targetAmount)).length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.monthlyTrend?.[0]?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats?.monthlyTrend?.[0]?.total || 0)} raised
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Goals Progress */}
      {goals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {goals.slice(0, 3).map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{goal.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{goal.donorCount} supporters</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(Number(goal.currentAmount), goal.currency)}
                      </div>
                      <div className="text-sm text-gray-600">
                        of {formatCurrency(Number(goal.targetAmount), goal.currency)}
                      </div>
                    </div>
                  </div>
                  <Progress value={goal.progressPercentage} className="h-2" />
                  <div className="text-xs text-gray-600 text-right">
                    {goal.progressPercentage.toFixed(1)}% complete
                  </div>
                </div>
              ))}
              {goals.length > 3 && (
                <div className="text-center pt-4">
                  <Link href="/dashboard/donations/goals">
                    <Button variant="outline" size="sm">
                      View All Goals ({goals.length})
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Trend */}
      {stats?.monthlyTrend && stats.monthlyTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.monthlyTrend.slice(0, 6).map((month, index) => (
                <div key={month.month} className="flex justify-between items-center">
                  <div className="font-medium">
                    {new Date(month.month + '-01').toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long'
                    })}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(month.total)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {month.count} donations
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/donations/goals">
              <Button variant="outline" className="w-full justify-start">
                <Target className="h-4 w-4 mr-2" />
                Create New Goal
              </Button>
            </Link>
            <Link href="/dashboard/donations">
              <Button variant="outline" className="w-full justify-start">
                <Heart className="h-4 w-4 mr-2" />
                View All Donations
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start">
              <TrendingUp className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
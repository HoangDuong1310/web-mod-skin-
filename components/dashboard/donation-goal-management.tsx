'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff, Target, Calendar, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DonationGoalForm } from './donation-goal-form'

interface DonationGoal {
  id: string
  title: string
  description?: string
  targetAmount: number
  currentAmount: number
  currency: string
  isActive: boolean
  isVisible: boolean
  priority: number
  startDate: string
  endDate?: string
  showProgress: boolean
  showAmount: boolean
  showDonors: boolean
  createdAt: string
  updatedAt: string
  creator: {
    id: string
    name: string
    email: string
  }
  _count: {
    donations: number
  }
}

export function DonationGoalManagement() {
  const [goals, setGoals] = useState<DonationGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingGoal, setEditingGoal] = useState<DonationGoal | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/donations/goals')
      if (response.ok) {
        const data = await response.json()
        setGoals(data.goals)
      } else {
        throw new Error('Failed to fetch goals')
      }
    } catch (error) {
      console.error('Error fetching goals:', error)
      setError('Failed to load donation goals')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (goal: DonationGoal) => {
    try {
      const response = await fetch('/api/donations/goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: goal.id,
          isActive: !goal.isActive
        })
      })

      if (response.ok) {
        fetchGoals()
      } else {
        throw new Error('Failed to update goal')
      }
    } catch (error) {
      console.error('Error updating goal:', error)
      setError('Failed to update goal status')
    }
  }

  const handleToggleVisible = async (goal: DonationGoal) => {
    try {
      const response = await fetch('/api/donations/goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: goal.id,
          isVisible: !goal.isVisible
        })
      })

      if (response.ok) {
        fetchGoals()
      } else {
        throw new Error('Failed to update goal')
      }
    } catch (error) {
      console.error('Error updating goal:', error)
      setError('Failed to update goal visibility')
    }
  }

  const handleDelete = async (goal: DonationGoal) => {
    if (!confirm(`Are you sure you want to delete "${goal.title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/donations/goals?id=${goal.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchGoals()
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete goal')
      }
    } catch (error) {
      console.error('Error deleting goal:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete goal')
    }
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingGoal(null)
    fetchGoals()
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getProgressPercentage = (current: number, target: number) => {
    return target > 0 ? Math.min((current / target) * 100, 100) : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Donation Goals</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage fundraising goals and campaigns
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingGoal(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? 'Edit Donation Goal' : 'Create New Donation Goal'}
              </DialogTitle>
            </DialogHeader>
            <DonationGoalForm
              goal={editingGoal}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Goals Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {goals.filter(g => g.isActive).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                goals.reduce((sum, goal) => sum + Number(goal.currentAmount), 0)
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {goals.reduce((sum, goal) => sum + goal._count.donations, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Donation Goals</CardTitle>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No donation goals
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create your first donation goal to start fundraising.
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Donations</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {goals.map((goal) => (
                    <TableRow key={goal.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{goal.title}</div>
                          {goal.description && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                              {goal.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="w-24">
                          <div className="flex justify-between text-xs mb-1">
                            <span>{getProgressPercentage(Number(goal.currentAmount), Number(goal.targetAmount)).toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ 
                                width: `${getProgressPercentage(Number(goal.currentAmount), Number(goal.targetAmount))}%` 
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {formatCurrency(Number(goal.currentAmount), goal.currency)}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">
                            of {formatCurrency(Number(goal.targetAmount), goal.currency)}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline">
                          {goal._count.donations} donations
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={goal.isActive}
                            onCheckedChange={() => handleToggleActive(goal)}
                          />
                          <span className="text-sm">
                            {goal.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleVisible(goal)}
                          >
                            {goal.isVisible ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </Button>
                          <span className="text-sm">
                            {goal.isVisible ? 'Public' : 'Hidden'}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(goal.createdAt)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingGoal(goal)
                              setIsFormOpen(true)
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(goal)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Target, Settings, Calendar, Eye } from 'lucide-react'

const goalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  targetAmount: z.number().min(1, 'Target amount must be greater than 0'),
  currency: z.string().default('USD'),
  isActive: z.boolean().default(true),
  isVisible: z.boolean().default(true),
  priority: z.number().default(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  showProgress: z.boolean().default(true),
  showAmount: z.boolean().default(true),
  showDonors: z.boolean().default(true),
})

type GoalFormData = z.infer<typeof goalSchema>

interface DonationGoal {
  id: string
  title: string
  description?: string
  targetAmount: number
  currency: string
  isActive: boolean
  isVisible: boolean
  priority: number
  startDate: string
  endDate?: string
  showProgress: boolean
  showAmount: boolean
  showDonors: boolean
}

interface DonationGoalFormProps {
  goal?: DonationGoal | null
  onSuccess: () => void
  onCancel: () => void
}

export function DonationGoalForm({ goal, onSuccess, onCancel }: DonationGoalFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('basic')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: goal ? {
      title: goal.title,
      description: goal.description || '',
      targetAmount: Number(goal.targetAmount),
      currency: goal.currency,
      isActive: goal.isActive,
      isVisible: goal.isVisible,
      priority: goal.priority,
      startDate: goal.startDate ? new Date(goal.startDate).toISOString().split('T')[0] : '',
      endDate: goal.endDate ? new Date(goal.endDate).toISOString().split('T')[0] : '',
      showProgress: goal.showProgress,
      showAmount: goal.showAmount,
      showDonors: goal.showDonors,
    } : {
      title: '',
      description: '',
      targetAmount: 0,
      currency: 'USD',
      isActive: true,
      isVisible: true,
      priority: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      showProgress: true,
      showAmount: true,
      showDonors: true,
    }
  })

  const watchedFields = watch()

  const onSubmit = async (data: GoalFormData) => {
    setError('')
    setLoading(true)

    try {
      const submitData = {
        ...data,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
        ...(goal && { id: goal.id })
      }

      const response = await fetch('/api/donations/goals', {
        method: goal ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save goal')
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving goal:', error)
      setError(error instanceof Error ? error.message : 'Failed to save goal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="display" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Display
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="e.g., Server Hosting Fund"
                  disabled={loading}
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Describe what this fundraising goal is for..."
                  rows={3}
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetAmount">Target Amount *</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    step="0.01"
                    min="1"
                    {...register('targetAmount', { valueAsNumber: true })}
                    placeholder="1000.00"
                    disabled={loading}
                  />
                  {errors.targetAmount && (
                    <p className="text-sm text-red-600">{errors.targetAmount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    {...register('currency')}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="VND">VND (₫)</option>
                  </select>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register('startDate')}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register('endDate')}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                {...register('priority', { valueAsNumber: true })}
                placeholder="0"
                disabled={loading}
              />
              <p className="text-sm text-gray-600">
                Higher priority goals are shown first (0 = lowest priority)
              </p>
            </div>
          </TabsContent>

          {/* Display Tab */}
          <TabsContent value="display" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label htmlFor="showProgress">Show Progress Bar</Label>
                  <p className="text-sm text-gray-600">Display progress visualization</p>
                </div>
                <Switch
                  id="showProgress"
                  checked={watchedFields.showProgress}
                  onCheckedChange={(checked) => setValue('showProgress', checked)}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label htmlFor="showAmount">Show Amounts</Label>
                  <p className="text-sm text-gray-600">Display current and target amounts</p>
                </div>
                <Switch
                  id="showAmount"
                  checked={watchedFields.showAmount}
                  onCheckedChange={(checked) => setValue('showAmount', checked)}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label htmlFor="showDonors">Show Donor Count</Label>
                  <p className="text-sm text-gray-600">Display number of supporters</p>
                </div>
                <Switch
                  id="showDonors"
                  checked={watchedFields.showDonors}
                  onCheckedChange={(checked) => setValue('showDonors', checked)}
                  disabled={loading}
                />
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label htmlFor="isActive">Active</Label>
                  <p className="text-sm text-gray-600">Accept donations for this goal</p>
                </div>
                <Switch
                  id="isActive"
                  checked={watchedFields.isActive}
                  onCheckedChange={(checked) => setValue('isActive', checked)}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label htmlFor="isVisible">Public Visibility</Label>
                  <p className="text-sm text-gray-600">Show this goal to visitors</p>
                </div>
                <Switch
                  id="isVisible"
                  checked={watchedFields.isVisible}
                  onCheckedChange={(checked) => setValue('isVisible', checked)}
                  disabled={loading}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              goal ? 'Update Goal' : 'Create Goal'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
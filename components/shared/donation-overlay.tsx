'use client'

import { useState, useEffect } from 'react'
import { X, Heart, Target, Users, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { DonationForm } from './donation-form'
import { DonationMessages } from './donation-messages'

interface DonationGoal {
  id: string
  title: string
  description?: string
  targetAmount: number
  currentAmount: number
  currency: string
  showProgress: boolean
  showAmount: boolean
  showDonors: boolean
  startDate: string
  endDate?: string
  donorCount: number
  progressPercentage: number
  recentDonations?: Array<{
    amount: number
    donorName: string
    message?: string
    createdAt: string
  }>
}

interface DonationOverlayProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

export function DonationOverlay({ isOpen, onClose, className }: DonationOverlayProps) {
  const [goals, setGoals] = useState<DonationGoal[]>([])
  const [activeGoal, setActiveGoal] = useState<DonationGoal | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showMessages, setShowMessages] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchGoals()
    }
  }, [isOpen])

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/donations/goals?public=true')
      if (response.ok) {
        const data = await response.json()
        setGoals(data.goals)
        if (data.goals.length > 0) {
          setActiveGoal(data.goals[0]) // Set first goal as active
        }
      }
    } catch (error) {
      console.error('Error fetching donation goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDonationSuccess = () => {
    setShowForm(false)
    fetchGoals() // Refresh goals to update progress
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Overlay Content */}
      <div className={`relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto ${className}`}>
        <Card className="bg-white dark:bg-gray-900 shadow-2xl border-0">
          <CardContent className="p-0">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-4">
                <Heart className="h-8 w-8 text-red-300" />
                <div>
                  <h2 className="text-2xl font-bold">Support Our Mission</h2>
                  <p className="text-blue-100">Help us continue providing free software and services</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : goals.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No donation goals are currently active.
                  </p>
                </div>
              ) : showForm ? (
                <DonationForm
                  goal={activeGoal}
                  onSuccess={handleDonationSuccess}
                  onCancel={() => setShowForm(false)}
                />
              ) : showMessages ? (
                <DonationMessages
                  goal={activeGoal}
                  onBack={() => setShowMessages(false)}
                />
              ) : (
                <div className="space-y-6">
                  {/* Goal Selection */}
                  {goals.length > 1 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Choose a cause to support:
                      </label>
                      <div className="grid gap-2">
                        {goals.map((goal) => (
                          <button
                            key={goal.id}
                            onClick={() => setActiveGoal(goal)}
                            className={`p-3 rounded-lg border text-left transition-colors ${
                              activeGoal?.id === goal.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                            }`}
                          >
                            <div className="font-medium">{goal.title}</div>
                            {goal.description && (
                              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {goal.description}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Goal Details */}
                  {activeGoal && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{activeGoal.title}</h3>
                        {activeGoal.description && (
                          <p className="text-gray-600 dark:text-gray-400">
                            {activeGoal.description}
                          </p>
                        )}
                      </div>

                      {/* Progress Section */}
                      {activeGoal.showProgress && (
                        <div className="space-y-3">
                          <Progress value={activeGoal.progressPercentage} className="h-3" />
                          
                          <div className="flex justify-between items-center text-sm">
                            {activeGoal.showAmount && (
                              <div>
                                <span className="font-semibold text-lg text-blue-600">
                                  {formatCurrency(activeGoal.currentAmount, activeGoal.currency)}
                                </span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {' '}of {formatCurrency(activeGoal.targetAmount, activeGoal.currency)}
                                </span>
                              </div>
                            )}
                            <div className="text-gray-600 dark:text-gray-400">
                              {activeGoal.progressPercentage.toFixed(1)}% complete
                            </div>
                          </div>

                          <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400">
                            {activeGoal.showDonors && (
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{activeGoal.donorCount} supporters</span>
                              </div>
                            )}
                            {activeGoal.endDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Until {formatDate(activeGoal.endDate)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Recent Donations */}
                      {activeGoal.recentDonations && activeGoal.recentDonations.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            Recent Supporters
                          </h4>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {activeGoal.recentDonations.slice(0, 3).map((donation, index) => (
                              <div 
                                key={index}
                                className="flex justify-between items-start p-2 bg-gray-50 dark:bg-gray-800 rounded"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-sm">
                                    {donation.donorName}
                                  </div>
                                  {donation.message && (
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                      "{donation.message}"
                                    </div>
                                  )}
                                </div>
                                <div className="text-sm font-medium text-blue-600">
                                  {formatCurrency(donation.amount, activeGoal.currency)}
                                </div>
                              </div>
                            ))}
                          </div>
                          {activeGoal.recentDonations.length > 3 && (
                            <button
                              onClick={() => setShowMessages(true)}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              View all messages ({activeGoal.recentDonations.length})
                            </button>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4">
                        <Button
                          onClick={() => setShowForm(true)}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          <Heart className="h-4 w-4 mr-2" />
                          Donate Now
                        </Button>
                        {activeGoal.recentDonations && activeGoal.recentDonations.length > 0 && (
                          <Button
                            variant="outline"
                            onClick={() => setShowMessages(true)}
                          >
                            View Messages
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
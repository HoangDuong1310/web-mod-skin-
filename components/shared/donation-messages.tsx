'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MessageCircle, Heart } from 'lucide-react'

interface DonationGoal {
  id: string
  title: string
  currency: string
  recentDonations?: Array<{
    amount: number
    donorName: string
    message?: string
    createdAt: string
  }>
}

interface DonationMessagesProps {
  goal?: DonationGoal | null
  onBack: () => void
}

export function DonationMessages({ goal, onBack }: DonationMessagesProps) {
  const [donations, setDonations] = useState<Array<{
    amount: number
    donorName: string
    message?: string
    createdAt: string
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (goal?.recentDonations) {
      setDonations(goal.recentDonations)
      setLoading(false)
    } else {
      fetchDonations()
    }
  }, [goal])

  const fetchDonations = async () => {
    if (!goal) return

    try {
      const response = await fetch(`/api/donations/stats?public=true&goalId=${goal.id}`)
      if (response.ok) {
        const data = await response.json()
        // In a real implementation, you'd have a dedicated endpoint for public donations
        // For now, we'll use the recent donations from the stats
        setDonations(data.goals?.[0]?.recentDonations || [])
      }
    } catch (error) {
      console.error('Error fetching donations:', error)
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const donationsWithMessages = donations.filter(d => d.message && d.message.trim())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h3 className="text-lg font-semibold">Supporter Messages</h3>
          {goal && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {goal.title}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : donationsWithMessages.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No messages yet
          </h4>
          <p className="text-gray-600 dark:text-gray-400">
            Be the first to leave an encouraging message with your donation!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {donationsWithMessages.length} message{donationsWithMessages.length !== 1 ? 's' : ''} from supporters
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {donationsWithMessages.map((donation, index) => (
              <div 
                key={index}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3"
              >
                {/* Donor Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Heart className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {donation.donorName}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(donation.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-blue-600">
                    {formatCurrency(donation.amount, goal?.currency)}
                  </div>
                </div>

                {/* Message */}
                <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed pl-10">
                  "{donation.message}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Donations Summary */}
      {donations.length > donationsWithMessages.length && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <strong>{donations.length - donationsWithMessages.length}</strong> additional supporter{donations.length - donationsWithMessages.length !== 1 ? 's' : ''} 
            {' '}donated without leaving a message
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="text-center py-4 border-t">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Want to show your support?
        </p>
        <Button
          onClick={onBack}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Heart className="h-4 w-4 mr-2" />
          Make a Donation
        </Button>
      </div>
    </div>
  )
}
import { Metadata } from 'next'
import { DonationGoalManagement } from '@/components/dashboard/donation-goal-management'

export const metadata: Metadata = {
  title: 'Donation Goals - Admin Dashboard',
  description: 'Manage donation goals and fundraising campaigns',
}

export default function DonationGoalsPage() {
  return (
    <div className="container mx-auto p-6">
      <DonationGoalManagement />
    </div>
  )
}
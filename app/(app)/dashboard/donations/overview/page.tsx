import { Metadata } from 'next'
import { DonationDashboard } from '@/components/dashboard/donation-dashboard'

export const metadata: Metadata = {
  title: 'Donations Dashboard - Admin',
  description: 'Overview of donation statistics and fundraising goals',
}

export default function DonationsDashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <DonationDashboard />
    </div>
  )
}
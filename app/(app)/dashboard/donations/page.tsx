import { Metadata } from 'next'
import { DonationManagement } from '@/components/dashboard/donation-management'

export const metadata: Metadata = {
  title: 'Donations - Admin Dashboard',
  description: 'View and manage all donations',
}

export default function DonationsPage() {
  return (
    <div className="container mx-auto p-6">
      <DonationManagement />
    </div>
  )
}
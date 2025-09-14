import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SkinSubmissionsManagement from '@/components/dashboard/skin-submissions-management'

export const metadata: Metadata = {
  title: 'Custom Skin Submissions - Admin Dashboard',
  description: 'Manage and review custom skin submissions',
}

export default async function SkinSubmissionsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/signin')
  }
  
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return <SkinSubmissionsManagement />
}

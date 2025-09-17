import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ApprovedSkinsManagement from '@/components/dashboard/approved-skins-management'

export const metadata: Metadata = {
  title: 'Approved Custom Skins - Admin Dashboard',
  description: 'Manage all approved custom skins',
}

export default async function ApprovedSkinsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/signin')
  }
  
  if ((session.user as any).role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return <ApprovedSkinsManagement />
}
import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CustomSkinsAnalytics from '@/components/dashboard/custom-skins-analytics'

export const metadata: Metadata = {
  title: 'Phân tích Custom Skins | Admin Dashboard',
  description: 'Thống kê và phân tích chi tiết về custom skins'
}

export default async function CustomSkinsAnalyticsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  return <CustomSkinsAnalytics />
}
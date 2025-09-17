import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { canAccessDashboard } from '@/lib/auth-utils'
import { MobileBreadcrumb } from '@/components/shared/mobile-breadcrumb'
import { DashboardClient } from '@/components/dashboard/dashboard-client'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  if (!canAccessDashboard(session.user.role)) {
    redirect('/')
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <MobileBreadcrumb />
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-1">
          Monitor and manage your website statistics and activities
        </p>
      </div>
      
      <DashboardClient />
    </div>
  )
}


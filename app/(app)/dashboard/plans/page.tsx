import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { canAccessDashboard } from '@/lib/auth-utils'
import { MobileBreadcrumb } from '@/components/shared/mobile-breadcrumb'
import { PlansClient } from '@/components/dashboard/plans/plans-client'

export const metadata = {
  title: 'Quản lý Gói cước',
  description: 'Quản lý các gói subscription của hệ thống',
}

export default async function PlansPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  if (!canAccessDashboard(session.user.role)) {
    redirect('/')
  }

  return (
    <div className="space-y-6">
      <MobileBreadcrumb />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Gói cước</h2>
          <p className="text-muted-foreground mt-1">
            Quản lý các gói subscription và pricing
          </p>
        </div>
      </div>
      
      <PlansClient />
    </div>
  )
}

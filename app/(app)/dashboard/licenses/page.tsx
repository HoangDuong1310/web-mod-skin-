import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { canAccessDashboard } from '@/lib/auth-utils'
import { MobileBreadcrumb } from '@/components/shared/mobile-breadcrumb'
import { LicensesClient } from '@/components/dashboard/licenses/licenses-client'

export const metadata = {
  title: 'Quản lý License Keys',
  description: 'Quản lý các license keys của hệ thống',
}

export default async function LicensesPage() {
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
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">License Keys</h2>
          <p className="text-muted-foreground mt-1">
            Quản lý các license keys và theo dõi việc sử dụng
          </p>
        </div>
      </div>
      
      <LicensesClient />
    </div>
  )
}

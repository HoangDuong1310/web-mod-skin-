import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { canAccessDashboard } from '@/lib/auth-utils'
import { MobileBreadcrumb } from '@/components/shared/mobile-breadcrumb'
import { ResellersClient } from '@/components/dashboard/resellers/resellers-client'

export const metadata = {
  title: 'Quản lý Reseller',
  description: 'Quản lý các đại lý bán key của hệ thống',
}

export default async function ResellersPage() {
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
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Quản lý Reseller</h2>
          <p className="text-muted-foreground mt-1">
            Quản lý đại lý, duyệt yêu cầu, cấu hình quota và theo dõi hoạt động
          </p>
        </div>
      </div>
      
      <ResellersClient />
    </div>
  )
}

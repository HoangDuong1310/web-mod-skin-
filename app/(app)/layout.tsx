import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canAccessDashboard } from '@/lib/auth-utils'
import { getPostLogoutRedirectUrl } from '@/lib/redirect-utils'
import { AppSidebar } from '@/components/shared/app-sidebar'
import { AppHeader } from '@/components/shared/app-header'

interface AppLayoutProps {
  children: React.ReactNode
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin?callbackUrl=/dashboard')
  }

  // Allow ADMIN and STAFF roles to access dashboard
  if (!canAccessDashboard(session.user.role)) {
    redirect(getPostLogoutRedirectUrl())
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar session={session} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader user={session.user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}


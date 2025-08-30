import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canAccessDashboard } from '@/lib/auth-utils'
import { getPostLogoutRedirectUrl } from '@/lib/redirect-utils'
import { MobileAppLayout } from '@/components/shared/mobile-app-layout'

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

  return <MobileAppLayout session={session}>{children}</MobileAppLayout>
}


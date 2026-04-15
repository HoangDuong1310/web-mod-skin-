import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { MobileBreadcrumb } from '@/components/shared/mobile-breadcrumb'
import { PartySettingsTab } from '@/components/dashboard/party-settings-tab'

export default async function PartySettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/')
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <MobileBreadcrumb />
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Party Mode Settings</h2>
        <p className="text-muted-foreground mt-1">
          Configure and monitor the Party Mode relay server
        </p>
      </div>

      <PartySettingsTab />
    </div>
  )
}

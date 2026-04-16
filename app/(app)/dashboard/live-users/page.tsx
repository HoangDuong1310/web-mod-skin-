import { LiveUsersWidget } from '@/components/dashboard/live-users-widget'
import { LiveUsersTable } from '@/components/dashboard/live-users-table'

export default function LiveUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Live Users</h1>
        <p className="text-muted-foreground">Real-time tracking of active Ainz users. Auto-refreshes every 10 seconds.</p>
      </div>
      <LiveUsersWidget />
      <LiveUsersTable />
    </div>
  )
}

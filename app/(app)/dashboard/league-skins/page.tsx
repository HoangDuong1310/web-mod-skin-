import LeagueSkinsManagement from '@/components/dashboard/league-skins-management'
import { MobileBreadcrumb } from '@/components/shared/mobile-breadcrumb'

export default function LeagueSkinsPage() {
  return (
    <div className="space-y-6">
      <MobileBreadcrumb />
      <LeagueSkinsManagement />
    </div>
  )
}

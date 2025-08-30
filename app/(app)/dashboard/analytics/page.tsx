import DownloadAnalytics from '@/components/dashboard/download-analytics'
import { MobileBreadcrumb } from '@/components/shared/mobile-breadcrumb'

export default function DownloadAnalyticsPage() {
  return (
    <div className="space-y-6">
      <MobileBreadcrumb />
      <DownloadAnalytics />
    </div>
  )
}

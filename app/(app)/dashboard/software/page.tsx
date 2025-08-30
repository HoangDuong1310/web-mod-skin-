import EnhancedSoftwareManagement from '@/components/dashboard/enhanced-software-management'
import { MobileBreadcrumb } from '@/components/shared/mobile-breadcrumb'

export default function SoftwarePage() {
  return (
    <div className="space-y-6">
      <MobileBreadcrumb />
      <EnhancedSoftwareManagement />
    </div>
  )
}

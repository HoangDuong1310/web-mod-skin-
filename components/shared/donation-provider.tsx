'use client'

import { usePathname } from 'next/navigation'
import { useDonationStore } from '@/hooks/use-donation-overlay'
import { DonationOverlay } from './donation-overlay'
import { DonationTrigger } from './donation-trigger'

export function DonationProvider() {
  const { isOverlayOpen, closeOverlay } = useDonationStore()
  const pathname = usePathname()
  
  // Don't show donation trigger/overlay in admin dashboard
  const isAdminArea = pathname.startsWith('/dashboard')
  
  if (isAdminArea) {
    return null
  }

  return (
    <>
      {/* Always show trigger immediately on non-admin pages */}
      <DonationTrigger showAfter={0} />
      <DonationOverlay 
        isOpen={isOverlayOpen} 
        onClose={closeOverlay} 
      />
    </>
  )
}
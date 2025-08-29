'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import MaintenancePage from '@/app/maintenance/page'

export function MaintenanceChecker({ children }: { children: React.ReactNode }) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { data: session } = useSession()
  const pathname = usePathname()

  // Skip maintenance check for admin routes and API routes
  const isAdminRoute = pathname.startsWith('/dashboard') || 
                      pathname.startsWith('/auth') ||
                      pathname.startsWith('/api')

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        // Only check maintenance mode for public routes
        if (!isAdminRoute) {
          const response = await fetch('/api/maintenance')
          if (response.ok) {
            const data = await response.json()
            setIsMaintenanceMode(data.maintenanceMode || false)
          }
        }
      } catch (error) {
        console.error('Error checking maintenance mode:', error)
        // Don't block on error, assume not in maintenance mode
        setIsMaintenanceMode(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkMaintenanceMode()
  }, [isAdminRoute])

  // Show loading during initial check
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show maintenance page if maintenance mode is enabled and user is not admin
  if (isMaintenanceMode && !isAdminRoute && session?.user?.role !== 'ADMIN') {
    return <MaintenancePage />
  }

  return <>{children}</>
}

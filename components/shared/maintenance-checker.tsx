'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { MaintenanceDisplay } from './maintenance-display'
import { DEFAULT_CONFIG } from '@/lib/default-config'

export function MaintenanceChecker({ children }: { children: React.ReactNode }) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [siteSettings, setSiteSettings] = useState({
    siteName: DEFAULT_CONFIG.siteName,
    supportEmail: DEFAULT_CONFIG.supportEmail
  })
  const { data: session, status } = useSession()
  const pathname = usePathname()

  // Skip maintenance check for admin routes, API routes, and static assets
  const isExcludedRoute = pathname.startsWith('/dashboard') ||
                         pathname.startsWith('/auth') ||
                         pathname.startsWith('/api') ||
                         pathname.startsWith('/_next') ||
                         pathname.startsWith('/maintenance') ||
                         pathname === '/favicon.ico' ||
                         pathname === '/robots.txt' ||
                         pathname === '/sitemap.xml'

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      // Skip check if user is admin or on excluded routes
      if (isExcludedRoute || session?.user?.role === 'ADMIN') {
        setIsLoading(false)
        return
      }

      // Only check when session is loaded (not loading)
      if (status === 'loading') {
        return
      }

      try {
        const response = await fetch('/api/maintenance')
        if (response.ok) {
          const data = await response.json()
          setIsMaintenanceMode(data.maintenanceMode || false)
          
          // Get site settings for display
          if (data.siteName || data.supportEmail) {
            setSiteSettings({
              siteName: data.siteName || DEFAULT_CONFIG.siteName,
              supportEmail: data.supportEmail || DEFAULT_CONFIG.supportEmail
            })
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
  }, [isExcludedRoute, session?.user?.role, status])

  // Show loading during initial check (but not for excluded routes)
  if (isLoading && !isExcludedRoute) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show maintenance page if maintenance mode is enabled and user is not admin
  if (isMaintenanceMode && !isExcludedRoute && session?.user?.role !== 'ADMIN') {
    return (
      <MaintenanceDisplay
        siteName={siteSettings.siteName}
        supportEmail={siteSettings.supportEmail}
      />
    )
  }

  return <>{children}</>
}

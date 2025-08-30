'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

export function MobileBreadcrumb() {
  const pathname = usePathname()
  
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []
    
    // Always start with dashboard
    if (segments.includes('dashboard')) {
      breadcrumbs.push({ label: 'Dashboard', href: '/dashboard' })
      
      // Find the index of dashboard and get segments after it
      const dashboardIndex = segments.indexOf('dashboard')
      const dashboardSegments = segments.slice(dashboardIndex + 1)
      
      let currentPath = '/dashboard'
      
      dashboardSegments.forEach((segment, index) => {
        currentPath += `/${segment}`
        const isLast = index === dashboardSegments.length - 1
        
        // Convert segment to readable label
        const label = segment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        
        breadcrumbs.push({
          label,
          href: isLast ? undefined : currentPath
        })
      })
    }
    
    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()
  
  if (breadcrumbs.length <= 1) return null

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4 sm:mb-6 overflow-x-auto">
      <Home className="h-4 w-4 flex-shrink-0" />
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center space-x-1 flex-shrink-0">
          {index > 0 && <ChevronRight className="h-3 w-3" />}
          {item.href ? (
            <Link
              href={item.href as any}
              className="hover:text-foreground transition-colors whitespace-nowrap"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium whitespace-nowrap">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}
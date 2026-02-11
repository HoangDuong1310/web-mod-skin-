'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Session } from 'next-auth'
import { cn } from '@/lib/utils'
import {
  canManageSoftware,
  canManageReviews,
  canManageUsers,
  canAccessAnalytics,
  canAccessDashboard
} from '@/lib/auth-utils'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tags,
  FileText,
  Users,
  Settings,
  BarChart3,
  MessageSquare,
  Download,
  Folder,
  PenTool,
  Heart,
  Palette,
  Megaphone,
  Key,
  CreditCard,
  Store,
  Shield
} from 'lucide-react'

interface AppSidebarProps {
  session?: Session | null
  onClose?: () => void
}

interface NavigationItem {
  name: string
  href: string
  icon: any
  subItems?: { name: string; href: string }[]
}

const adminNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { 
    name: 'Software Management', 
    href: '/dashboard/software', 
    icon: Package,
    subItems: [
      { name: 'All Software', href: '/dashboard/software' },
      { name: 'Add New', href: '/dashboard/software/new' },
      { name: 'Categories', href: '/dashboard/categories' }
    ]
  },
  { name: 'Download Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { 
    name: 'Reviews', 
    href: '/dashboard/reviews', 
    icon: MessageSquare,
    subItems: [
      { name: 'All Reviews', href: '/dashboard/reviews' },
      { name: 'Review Filters', href: '/dashboard/reviews/filters' }
    ]
  },
  { 
    name: 'Custom Skins', 
    href: '/dashboard/custom-skins', 
    icon: Palette,
    subItems: [
      { name: 'Add New Skin', href: '/dashboard/custom-skins/add' },
      { name: 'Submissions', href: '/dashboard/skin-submissions' },
      { name: 'Approved Skins', href: '/dashboard/custom-skins/approved' },
      { name: 'Analytics', href: '/dashboard/custom-skins/analytics' }
    ]
  },
  { name: 'File Management', href: '/dashboard/files', icon: FileText },
  { 
    name: 'Donations', 
    href: '/dashboard/donations', 
    icon: Heart,
    subItems: [
      { name: 'Overview', href: '/dashboard/donations/overview' },
      { name: 'All Donations', href: '/dashboard/donations' },
      { name: 'Goals', href: '/dashboard/donations/goals' }
    ]
  },
  { 
    name: 'Banners', 
    href: '/dashboard/banners', 
    icon: Megaphone,
    subItems: [
      { name: 'All Banners', href: '/dashboard/banners' },
      { name: 'Create New', href: '/dashboard/banners/new' }
    ]
  },
  { 
    name: 'Content', 
    href: '/dashboard/content', 
    icon: PenTool,
    subItems: [
      { name: 'Blog Posts', href: '/dashboard/blog' },
      { name: 'Tags', href: '/dashboard/tags' }
    ]
  },
  { 
    name: 'Licenses', 
    href: '/dashboard/licenses', 
    icon: Key,
    subItems: [
      { name: 'All Licenses', href: '/dashboard/licenses' },
      { name: 'Plans', href: '/dashboard/plans' },
      { name: 'Orders', href: '/dashboard/orders' }
    ]
  },
  { name: 'Users', href: '/dashboard/users', icon: Users },
  { name: 'Resellers', href: '/dashboard/resellers', icon: Store },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

const userNavigation: NavigationItem[] = [
  { name: 'Browse Software', href: '/products', icon: Package },
  { name: 'My Downloads', href: '/profile/downloads', icon: Download },
  { name: 'Categories', href: '/categories', icon: Folder },
  { name: 'Blog', href: '/blog', icon: FileText },
]

export function AppSidebar({ session, onClose }: AppSidebarProps) {
  const pathname = usePathname()
  const userRole = (session?.user as any)?.role
  
  // Filter navigation based on user permissions
  const getFilteredNavigation = () => {
    if (!canAccessDashboard(userRole)) {
      return userNavigation
    }

    // Filter admin navigation based on permissions
    return adminNavigation.filter(item => {
      switch (item.href) {
        case '/dashboard/users':
          return canManageUsers(userRole)
        case '/dashboard/software':
          return canManageSoftware(userRole)
        case '/dashboard/reviews':
          return canManageReviews(userRole)
        case '/dashboard/analytics':
          return canAccessAnalytics(userRole)
        case '/dashboard/settings':
          return userRole === 'ADMIN'
        case '/dashboard/resellers':
          return userRole === 'ADMIN'
        default:
          return true // Dashboard and content are available to all staff
      }
    })
  }

  const navigation = getFilteredNavigation()
  const isAdminArea = pathname.startsWith('/dashboard')

  return (
    <div className="flex w-64 flex-col bg-card border-r h-full">
      {/* Mobile close button */}
      {onClose && (
        <div className="flex items-center justify-between p-4 lg:hidden">
          <span className="text-lg font-semibold">Menu</span>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-accent"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      <div className="flex h-16 items-center px-6">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold">
            Software
            <span className="text-primary">Hub</span>
          </span>
        </Link>
      </div>
      
      {/* Admin/User Badge */}
      {session?.user && (
        <div className="px-4 py-2">
          <div className="text-xs text-muted-foreground">
            {isAdminArea ? (userRole === 'ADMIN' ? 'Admin Panel' : 'Staff Panel') : 'User Panel'}
          </div>
        </div>
      )}
      
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navigation.map((item) => (
          <div key={item.name}>
            <Link
              href={item.href as any}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              onClick={onClose}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
            
            {/* Sub Items */}
            {item.subItems && pathname.startsWith(item.href) && (
              <div className="ml-6 mt-1 space-y-1">
                {item.subItems.map((subItem) => (
                  <Link
                    key={subItem.name}
                    href={subItem.href as any}
                    className={cn(
                      'block rounded-md px-3 py-1 text-xs transition-colors',
                      pathname === subItem.href
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={onClose}
                  >
                    {subItem.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      
      {/* User Info */}
      {session?.user && (
        <div className="border-t p-4">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session.user.name}</p>
              <p className="text-xs text-muted-foreground">{(session.user as any).role}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



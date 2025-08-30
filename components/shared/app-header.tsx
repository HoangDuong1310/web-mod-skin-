'use client'

import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { signOut } from 'next-auth/react'
import { LogOut, User, Menu } from 'lucide-react'
import { getPostLogoutRedirectUrl } from '@/lib/redirect-utils'

interface AppHeaderProps {
  user: {
    name?: string | null
    email?: string | null
    role?: string
  }
  onMenuClick?: () => void
  showMenuButton?: boolean
}

export function AppHeader({ user, onMenuClick, showMenuButton = false }: AppHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6">
      <div className="flex items-center space-x-4">
        {/* Mobile menu button */}
        {showMenuButton && onMenuClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <h2 className="text-lg font-semibold hidden sm:block">Admin Panel</h2>
        <h2 className="text-base font-semibold sm:hidden">Panel</h2>
      </div>
      
      <div className="flex items-center space-x-2 sm:space-x-4">
        <ThemeToggle />
        
        {/* User info - responsive */}
        <div className="hidden sm:flex items-center space-x-2 text-sm">
          <User className="h-4 w-4" />
          <span className="font-medium">{user.name || user.email}</span>
          <span className="text-muted-foreground">({user.role})</span>
        </div>
        
        {/* Mobile user info */}
        <div className="sm:hidden">
          <Button variant="ghost" size="sm" className="p-2">
            <User className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Sign out button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: getPostLogoutRedirectUrl() })}
          className="text-muted-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span className="ml-2 hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  )
}


'use client'

import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { signOut } from 'next-auth/react'
import { LogOut, User } from 'lucide-react'

interface AppHeaderProps {
  user: {
    name?: string | null
    email?: string | null
    role?: string
  }
}

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
      </div>
      
      <div className="flex items-center space-x-4">
        <ThemeToggle />
        
        <div className="flex items-center space-x-2 text-sm">
          <User className="h-4 w-4" />
          <span className="font-medium">{user.name || user.email}</span>
          <span className="text-muted-foreground">({user.role})</span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="text-muted-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span className="ml-2">Sign out</span>
        </Button>
      </div>
    </header>
  )
}


'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { canAccessDashboard } from '@/lib/auth-utils'
import { getPostLogoutRedirectUrl } from '@/lib/redirect-utils'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { MobileMenu } from '@/components/shared/mobile-menu'
import { User, LogOut, FileImage, Settings, Key, ShoppingCart } from 'lucide-react'

const navigation: { name: string; href: Route }[] = [
  { name: 'Home', href: '/' },
  { name: 'Apps', href: '/products' },
  { name: 'Custom Skins', href: '/custom-skins' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Blog', href: '/blog' },
  { name: 'Contact', href: '/contact' },
]

export function MainNav() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const canAccessAdmin = canAccessDashboard(session?.user?.role)

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center space-x-4 md:space-x-8">
        {/* Mobile Menu */}
        <MobileMenu />
        
        <Link href={'/' as Route} className="flex items-center">
          <Image
            src="/images/logo.ico"
            alt="Home"
            width={24}
            height={24}
            className="h-6 w-6"
            priority
          />
          <span className="sr-only">Home</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === item.href
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center space-x-4">
        <ThemeToggle />
        
        {/* Cart removed as requested */}

        {status === 'loading' ? (
          <Button variant="ghost" size="icon" disabled>
            <User className="h-5 w-5" />
          </Button>
        ) : session ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href={'/profile' as Route} className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={'/profile/licenses' as Route} className="cursor-pointer">
                    <Key className="h-4 w-4 mr-2" />
                    My Licenses
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={'/profile/orders' as Route} className="cursor-pointer">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Order History
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={'/profile/submissions' as Route} className="cursor-pointer">
                    <FileImage className="h-4 w-4 mr-2" />
                    My Submissions
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => signOut({ callbackUrl: getPostLogoutRedirectUrl() })}
                  className="cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {canAccessAdmin && (
              <Button asChild>
                <Link href={'/dashboard' as Route}>
                  {session?.user?.role === 'ADMIN' ? 'Admin Panel' : 'Staff Panel'}
                </Link>
              </Button>
            )}
          </>
        ) : (
          <>
            <Button variant="ghost" asChild>
              <Link href={'/auth/signin' as Route}>Sign In</Link>
            </Button>
            <Button asChild>
              <Link href={'/auth/signup' as Route}>Sign Up</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

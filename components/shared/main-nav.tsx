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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { MobileMenu } from '@/components/shared/mobile-menu'
import {
  User,
  LogOut,
  FileImage,
  Settings,
  Key,
  ShoppingCart,
  Store,
} from 'lucide-react'

const navigation: { name: string; href: Route }[] = [
  { name: 'Trang chủ', href: '/' },
  { name: 'Ứng dụng', href: '/products' },
  { name: 'Custom skins', href: '/custom-skins' },
  { name: 'Hướng dẫn', href: '/blog' },
  { name: 'Liên hệ', href: '/contact' },
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

        <Link
          href={'/' as Route}
          className="flex h-11 w-11 shrink-0 items-center justify-center"
          aria-label="Mod Skin LoL - Trang chủ"
        >
          <Image
            src="/images/logo.ico"
            alt="Mod Skin LoL - Trang chủ"
            width={24}
            height={24}
            className="h-6 w-6"
            priority
          />
        </Link>

        <nav className="hidden items-center space-x-6 md:flex">
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
                    <Settings className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={'/profile/licenses' as Route}
                    className="cursor-pointer"
                  >
                    <Key className="mr-2 h-4 w-4" />
                    My Licenses
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={'/profile/orders' as Route}
                    className="cursor-pointer"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Order History
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={'/profile/submissions' as Route}
                    className="cursor-pointer"
                  >
                    <FileImage className="mr-2 h-4 w-4" />
                    My Submissions
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={'/profile/reseller' as Route}
                    className="cursor-pointer"
                  >
                    <Store className="mr-2 h-4 w-4" />
                    Reseller
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    signOut({ callbackUrl: getPostLogoutRedirectUrl() })
                  }
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {canAccessAdmin && (
              <Button asChild>
                <Link href={'/dashboard' as Route}>
                  {session?.user?.role === 'ADMIN'
                    ? 'Admin Panel'
                    : 'Staff Panel'}
                </Link>
              </Button>
            )}
          </>
        ) : (
          <>
            <Button variant="ghost" asChild>
              <Link href={'/auth/signin' as Route}>Đăng nhập</Link>
            </Button>
            <Button asChild>
              <Link href={'/auth/signup' as Route}>Đăng ký</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

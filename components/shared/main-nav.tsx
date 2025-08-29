'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { User, LogOut } from 'lucide-react'

const navigation: { name: string; href: Route }[] = [
  { name: 'Home', href: '/' },
  { name: 'Apps', href: '/products' },
  { name: 'Categories', href: '/categories' },
  { name: 'Blog', href: '/blog' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
]

export function MainNav() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center space-x-8">
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
            <Button variant="ghost" size="icon" asChild>
              <Link href={'/profile' as Route}>
                <User className="h-5 w-5" />
                <span className="sr-only">Profile</span>
              </Link>
            </Button>

            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Sign Out</span>
            </Button>

            {isAdmin && (
              <Button asChild>
                <Link href={'/dashboard' as Route}>Admin Panel</Link>
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

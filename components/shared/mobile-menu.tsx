'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { canAccessDashboard } from '@/lib/auth-utils'
import { getPostLogoutRedirectUrl } from '@/lib/redirect-utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { 
  Menu, 
  X, 
  Home, 
  Package, 
  Palette, 
  CreditCard, 
  FileText, 
  Mail,
  User,
  Key,
  ShoppingCart,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Store
} from 'lucide-react'

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Apps', href: '/products', icon: Package },
  { name: 'Custom Skins', href: '/custom-skins', icon: Palette },
  { name: 'Pricing', href: '/pricing', icon: CreditCard },
  { name: 'Blog', href: '/blog', icon: FileText },
  { name: 'Contact', href: '/contact', icon: Mail },
]

const userNavigation = [
  { name: 'Profile Settings', href: '/profile', icon: Settings },
  { name: 'My Licenses', href: '/profile/licenses', icon: Key },
  { name: 'Order History', href: '/profile/orders', icon: ShoppingCart },
  { name: 'Reseller', href: '/profile/reseller', icon: Store },
]

export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const canAccessAdmin = canAccessDashboard(session?.user?.role)

  const handleLinkClick = () => {
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full py-4">
          {/* Main Navigation */}
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href as Route}
                  onClick={handleLinkClick}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <Separator className="my-4" />

          {/* User Section */}
          {session ? (
            <>
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{session.user?.name}</p>
                <p className="text-xs text-muted-foreground">{session.user?.email}</p>
              </div>
              
              <nav className="space-y-1 mt-2">
                {userNavigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href as Route}
                      onClick={handleLinkClick}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  )
                })}

                {canAccessAdmin && (
                  <Link
                    href={'/dashboard' as Route}
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-accent"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {session?.user?.role === 'ADMIN' ? 'Admin Panel' : 'Staff Panel'}
                  </Link>
                )}
              </nav>

              <div className="mt-auto pt-4">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    signOut({ callbackUrl: getPostLogoutRedirectUrl() })
                    setOpen(false)
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-2 mt-auto">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={'/auth/signin' as Route} onClick={handleLinkClick}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Link>
              </Button>
              <Button asChild className="w-full justify-start">
                <Link href={'/auth/signup' as Route} onClick={handleLinkClick}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Sign Up
                </Link>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

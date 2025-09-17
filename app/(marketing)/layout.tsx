import React from 'react'
import { MainNav } from '@/components/shared/main-nav'
import { Footer } from '@/components/shared/footer'

interface MarketingLayoutProps {
  children: React.ReactNode
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <MainNav />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}



import React from 'react'
import { MainNav } from '@/components/shared/main-nav'
import { Footer } from '@/components/shared/footer'
import { AnnouncementBanner } from '@/components/shared/announcement-banner'
import { BannerModal } from '@/components/shared/banner-modal'
import { prisma } from '@/lib/prisma'
import type { Banner } from '@/types/banner'

interface MarketingLayoutProps {
  children: React.ReactNode
}

async function getInitialTopBanners(): Promise<Banner[]> {
  try {
    const now = new Date()
    const banners = await prisma.banner.findMany({
      where: {
        position: 'TOP',
        isActive: true,
        deletedAt: null,
        targetAudience: { in: ['ALL', 'GUEST'] },
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 3,
    })

    return banners.map((banner) => ({
      ...banner,
      startDate: banner.startDate?.toISOString() || null,
      endDate: banner.endDate?.toISOString() || null,
      createdAt: banner.createdAt.toISOString(),
      updatedAt: banner.updatedAt.toISOString(),
    }))
  } catch (error) {
    console.error('Failed to preload announcement banners:', error)
    return []
  }
}

export default async function MarketingLayout({
  children,
}: MarketingLayoutProps) {
  const initialTopBanners = await getInitialTopBanners()

  return (
    <>
      {/* Top Banner for announcements/livestream */}
      <AnnouncementBanner position="TOP" initialBanners={initialTopBanners} />

      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <MainNav />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <Footer />

      {/* Modal Banner for important announcements */}
      <BannerModal />
    </>
  )
}

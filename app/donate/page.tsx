// app/donate/page.tsx
import { DonateHero } from '@/components/donation/donate-hero'
import { DonorWall } from '@/components/donation/donor-wall'
import { DonatePageClient } from './donate-client'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Ủng hộ — WebModSkin',
  description: 'Giúp WebModSkin tiếp tục miễn phí cho mọi người.',
  alternates: {
    canonical: '/donate',
  },
}

export default function DonatePage() {
  return (
    <>
      <DonateHero />
      <DonatePageClient />
      <section className="border-b border-neutral-200">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Donor wall
              </div>
              <h2 className="text-3xl font-bold tracking-tight">
                Người ủng hộ gần đây
              </h2>
            </div>
            <a
              href="/donate/donors"
              className="text-sm font-medium underline underline-offset-4 hover:text-neutral-600"
            >
              Xem tất cả
            </a>
          </div>
          <DonorWall limit={8} />
        </div>
      </section>
    </>
  )
}

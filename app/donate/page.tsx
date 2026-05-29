// app/donate/page.tsx
import { DonateHero } from '@/components/donation/donate-hero'
import { DonorWall } from '@/components/donation/donor-wall'
import { DonatePageClient } from './donate-client'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Ủng hộ — WebModSkin',
  description: 'Giúp WebModSkin tiếp tục miễn phí cho mọi người.',
}

export default function DonatePage() {
  return (
    <>
      <DonateHero />
      <DonatePageClient />
      <section className="border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="text-xs font-semibold tracking-wider uppercase text-neutral-500 mb-3">Donor wall</div>
              <h2 className="text-3xl font-bold tracking-tight">Người ủng hộ gần đây</h2>
            </div>
            <a href="/donate/donors" className="text-sm font-medium underline underline-offset-4 hover:text-neutral-600">Xem tất cả</a>
          </div>
          <DonorWall limit={8} />
        </div>
      </section>
    </>
  )
}

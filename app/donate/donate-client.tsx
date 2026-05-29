// app/donate/donate-client.tsx
'use client'

import { useState } from 'react'
import { DonateForm } from '@/components/donation/donate-form'
import { TierLadder } from '@/components/donation/tier-ladder'

export function DonatePageClient() {
  const [selectedAmount, setSelectedAmount] = useState<number | undefined>(undefined)

  return (
    <>
      <section id="form" className="border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Cách ủng hộ</h2>
            <p className="mt-3 text-neutral-600">VietQR là cách nhanh nhất tại Việt Nam, không mất phí giao dịch.</p>
          </div>
          <DonateForm initialAmount={selectedAmount} />
        </div>
      </section>

      <section id="tiers" className="border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="max-w-2xl mb-14">
            <div className="text-xs font-semibold tracking-wider uppercase text-neutral-500 mb-3">Các mức ủng hộ</div>
            <h2 className="text-3xl font-bold tracking-tight">Lời cảm ơn dành cho bạn</h2>
            <p className="mt-3 text-neutral-600">Tier được tính theo tổng số tiền tích lũy. Bạn có thể donate nhiều lần để lên tier cao hơn.</p>
          </div>
          <TierLadder onSelect={(vnd) => {
            setSelectedAmount(vnd)
            document.getElementById('form')?.scrollIntoView({ behavior: 'smooth' })
          }} />
        </div>
      </section>
    </>
  )
}

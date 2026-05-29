// components/donation/tier-ladder.tsx
'use client'

interface TierDef {
  key: 'BRONZE' | 'SILVER' | 'GOLD'
  label: string
  amount: string
  amountVND: number
  perks: string[]
  popular?: boolean
}

const TIERS: TierDef[] = [
  {
    key: 'BRONZE', label: 'Bronze', amount: '50.000₫', amountVND: 50_000,
    perks: ['Bronze badge trên profile', 'Tên trên Donor Wall', 'Email cảm ơn cá nhân'],
  },
  {
    key: 'SILVER', label: 'Silver', amount: '200.000₫', amountVND: 200_000, popular: true,
    perks: ['Tất cả quyền lợi Bronze', 'Silver badge nổi bật', 'Early access skin mới (7 ngày)', 'Discord supporter role'],
  },
  {
    key: 'GOLD', label: 'Gold', amount: '500.000₫', amountVND: 500_000,
    perks: ['Tất cả quyền lợi Silver', 'Gold badge', 'Priority support 24h', 'Vote feature ưu tiên', 'Tên trong credits của app'],
  },
]

export function TierLadder({ onSelect }: { onSelect?: (vnd: number) => void }) {
  return (
    <div className="grid md:grid-cols-3 gap-px bg-neutral-200 border border-neutral-200 rounded-lg overflow-hidden">
      {TIERS.map((t) => (
        <div key={t.key} className="bg-white p-8 relative">
          {t.popular && (
            <div className="absolute top-4 right-4 text-[10px] font-semibold tracking-wider uppercase text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
              Phổ biến
            </div>
          )}
          <div className="text-xs font-semibold tracking-wider uppercase text-neutral-500 mb-4">{t.label}</div>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-3xl font-bold">{t.amount}</span>
            <span className="text-neutral-500 text-sm">trở lên</span>
          </div>
          <ul className="space-y-3 text-sm text-neutral-700">
            {t.perks.map((p) => (
              <li key={p} className="flex gap-2"><span className="text-neutral-400 mt-0.5">—</span><span>{p}</span></li>
            ))}
          </ul>
          <button
            onClick={() => onSelect?.(t.amountVND)}
            className={t.popular
              ? 'mt-8 w-full h-10 rounded-md bg-black text-white text-sm font-medium hover:bg-neutral-800'
              : 'mt-8 w-full h-10 rounded-md border border-neutral-200 text-sm font-medium hover:border-black'}
          >
            Chọn {t.label}
          </button>
        </div>
      ))}
    </div>
  )
}

// components/donation/donor-wall.tsx
'use client'

import { useEffect, useState } from 'react'

interface Donor {
  id: string
  name: string | null
  tier: string | null
  verifiedAt: string | null
}

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'hôm nay'
  return `${days} ngày trước`
}

export function DonorWall({ limit = 8 }: { limit?: number }) {
  const [donors, setDonors] = useState<Donor[]>([])

  useEffect(() => {
    fetch(`/api/donations/donor-wall?limit=${limit}`)
      .then((r) => r.ok ? r.json() : { donors: [] })
      .then((d) => setDonors(d.donors ?? []))
      .catch(() => {})
  }, [limit])

  if (donors.length === 0) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 text-sm">
      {donors.map((d) => (
        <div key={d.id} className="py-3 border-b border-neutral-200">
          <div className={d.name ? 'font-medium' : 'font-medium text-neutral-500 italic'}>
            {d.name ?? 'Anonymous'}
          </div>
          <div className="text-xs text-neutral-500">
            {d.tier ?? 'Donor'} · {timeAgo(d.verifiedAt)}
          </div>
        </div>
      ))}
    </div>
  )
}

// components/donation/goal-progress.tsx
'use client'

import { useEffect, useState } from 'react'

interface Goal {
  title: string
  currentAmount: number
  targetAmount: number
  donorCount?: number
}

function formatVND(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + '₫'
}

export function GoalProgress({ pollMs = 60_000 }: { pollMs?: number }) {
  const [goal, setGoal] = useState<Goal | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await fetch('/api/donations/goals?public=true')
        if (res.ok && active) {
          const data = await res.json()
          if (data.goals?.length) setGoal(data.goals[0])
        }
      } catch { /* silent */ }
    }
    load()
    const id = setInterval(load, pollMs)
    return () => { active = false; clearInterval(id) }
  }, [pollMs])

  if (!goal) return null
  const pct = goal.targetAmount > 0
    ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
    : 0

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between text-sm mb-2">
        <span className="font-medium">{goal.title}</span>
        <span className="text-neutral-500">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
        <div className="h-full bg-black rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-baseline justify-between mt-2 text-sm">
        <span><span className="font-semibold">{formatVND(goal.currentAmount)}</span>
          <span className="text-neutral-500"> / {formatVND(goal.targetAmount)}</span></span>
        {goal.donorCount != null && (
          <span className="text-neutral-500">{goal.donorCount} người ủng hộ</span>
        )}
      </div>
    </div>
  )
}

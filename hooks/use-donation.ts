// hooks/use-donation.ts
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DonorTier } from '@/lib/donor-tiers'

export type PaymentMethod = 'VIETQR' | 'KOFI'
export type ModalContext = 'header' | 'post-download' | null

interface DonationSettings {
  kofiEnabled: boolean
  kofiUsername?: string
  vietqrEnabled: boolean
  vietqrBankId?: string
  vietqrAccountNo?: string
  vietqrAccountName?: string
}

interface DonationStore {
  // Modal
  isModalOpen: boolean
  modalContext: ModalContext
  openModal: (ctx: ModalContext) => void
  closeModal: () => void

  // Form
  amountVND: number | null
  message: string
  paymentMethod: PaymentMethod
  setAmount: (vnd: number) => void
  setMessage: (msg: string) => void
  setPaymentMethod: (m: PaymentMethod) => void

  // Settings cache
  settings: DonationSettings | null
  fetchSettings: () => Promise<void>

  // User tier
  myTier: DonorTier | null
  myTotalDonated: number
  fetchMyTier: () => Promise<void>

  // Nudge (7-day cooldown)
  lastNudgeDismissed: number | null
  shouldShowNudge: () => boolean
  dismissNudge: () => void
}

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000

export const useDonation = create<DonationStore>()(
  persist(
    (set, get) => ({
      isModalOpen: false,
      modalContext: null,
      openModal: (ctx) => set({ isModalOpen: true, modalContext: ctx }),
      closeModal: () => set({ isModalOpen: false, modalContext: null }),

      amountVND: null,
      message: '',
      paymentMethod: 'VIETQR',
      setAmount: (vnd) => set({ amountVND: vnd }),
      setMessage: (msg) => set({ message: msg }),
      setPaymentMethod: (m) => set({ paymentMethod: m }),

      settings: null,
      fetchSettings: async () => {
        try {
          const res = await fetch('/api/donations/settings')
          if (res.ok) {
            const data = await res.json()
            set({ settings: data.settings })
          }
        } catch { /* silent */ }
      },

      myTier: null,
      myTotalDonated: 0,
      fetchMyTier: async () => {
        try {
          const res = await fetch('/api/donations/my-tier')
          if (res.ok) {
            const data = await res.json()
            set({ myTier: data.tier, myTotalDonated: data.totalDonatedVND })
          }
        } catch { /* silent */ }
      },

      lastNudgeDismissed: null,
      shouldShowNudge: () => {
        const last = get().lastNudgeDismissed
        if (!last) return true
        return Date.now() - last > SEVEN_DAYS
      },
      dismissNudge: () => set({ lastNudgeDismissed: Date.now() }),
    }),
    {
      name: 'donation-store',
      partialize: (s) => ({ lastNudgeDismissed: s.lastNudgeDismissed }),
    }
  )
)

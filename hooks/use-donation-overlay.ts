'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DonationStore {
  isOverlayOpen: boolean
  lastShown: number | null
  showInterval: number // in milliseconds
  hasUserDismissed: boolean
  
  openOverlay: () => void
  closeOverlay: () => void
  dismissForSession: () => void
  shouldShowOverlay: () => boolean
  resetDismissal: () => void
}

export const useDonationStore = create<DonationStore>()(
  persist(
    (set, get) => ({
      isOverlayOpen: false,
      lastShown: null,
      showInterval: 3 * 60 * 1000, // 3 minutes (shorter interval)
      hasUserDismissed: false,
      
      openOverlay: () => {
        set({ 
          isOverlayOpen: true, 
          lastShown: Date.now(),
          hasUserDismissed: false 
        })
      },
      
      closeOverlay: () => {
        set({ isOverlayOpen: false })
      },
      
      dismissForSession: () => {
        set({ 
          isOverlayOpen: false, 
          hasUserDismissed: true 
        })
      },
      
      shouldShowOverlay: () => {
        const state = get()
        
        // Always show - remove all restrictions for testing
        return true
      },
      
      resetDismissal: () => {
        set({ hasUserDismissed: false })
      }
    }),
    {
      name: 'donation-overlay-storage',
      partialize: (state) => ({
        lastShown: state.lastShown,
        hasUserDismissed: state.hasUserDismissed,
        showInterval: state.showInterval
      })
    }
  )
)
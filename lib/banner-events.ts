// lib/banner-events.ts
//
// Lightweight cross-tab notification so that when an admin creates, updates,
// toggles, or deletes a banner in the dashboard, any other open tab/window
// showing the site (AnnouncementBanner / BannerModal) refetches immediately
// instead of waiting for the ~60s polling interval.
//
// Uses the `storage` event, which the browser fires automatically in every
// *other* tab/window of the same origin when localStorage changes here. No
// extra permissions or dependencies needed.

const STORAGE_KEY = 'banners:updatedAt'

/**
 * Call this right after a banner create/update/toggle/delete succeeds in the
 * dashboard. Other open tabs listening via `onBannersUpdated` will refetch
 * right away.
 */
export function notifyBannersUpdated() {
  try {
    localStorage.setItem(STORAGE_KEY, Date.now().toString())
  } catch {
    // localStorage may be unavailable (e.g. privacy mode); safe to ignore.
  }
}

/**
 * Subscribe to banner update notifications from other tabs/windows.
 * Returns an unsubscribe function.
 */
export function onBannersUpdated(callback: () => void): () => void {
  const handler = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      callback()
    }
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}

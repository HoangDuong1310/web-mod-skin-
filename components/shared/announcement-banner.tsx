'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, ExternalLink, Radio, Gift, AlertTriangle, CheckCircle, Calendar, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Banner, BANNER_STYLES, BannerType } from '@/types/banner'
import { useSession } from 'next-auth/react'

interface AnnouncementBannerProps {
  position?: 'TOP' | 'BOTTOM'
  className?: string
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  info: Info,
  video: Radio,
  gift: Gift,
  'alert-triangle': AlertTriangle,
  'check-circle': CheckCircle,
  calendar: Calendar,
}

export function AnnouncementBanner({ position = 'TOP', className }: AnnouncementBannerProps) {
  const [banners, setBanners] = useState<Banner[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const { data: session, status } = useSession()

  // Load dismissed banners from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('dismissedBanners')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Clear old dismissed banners (older than 24 hours)
        const now = Date.now()
        const validDismissed = Object.entries(parsed)
          .filter(([, timestamp]) => now - (timestamp as number) < 24 * 60 * 60 * 1000)
          .map(([id]) => id)
        setDismissedIds(new Set(validDismissed))
      } catch {
        setDismissedIds(new Set())
      }
    }
  }, [])

  // Fetch banners
  const fetchBanners = useCallback(async () => {
    try {
      const res = await fetch(`/api/banners?position=${position}`)
      if (res.ok) {
        const data = await res.json()
        setBanners(data.banners || [])
      }
    } catch (error) {
      console.error('Error fetching banners:', error)
    } finally {
      setLoading(false)
    }
  }, [position])

  useEffect(() => {
    fetchBanners()
    // Refresh banners every 5 minutes
    const interval = setInterval(fetchBanners, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchBanners])

  // Filter banners based on audience
  const filteredBanners = banners.filter((banner) => {
    // Skip dismissed banners
    if (dismissedIds.has(banner.id)) return false

    // Check audience
    if (banner.targetAudience === 'AUTHENTICATED' && status !== 'authenticated') return false
    if (banner.targetAudience === 'GUEST' && status === 'authenticated') return false

    return true
  })

  // Dismiss handler
  const handleDismiss = (bannerId: string) => {
    // Track dismiss
    fetch(`/api/banners/${bannerId}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'view' }),
    }).catch(() => {})

    // Update state
    const newDismissed = new Set(dismissedIds)
    newDismissed.add(bannerId)
    setDismissedIds(newDismissed)

    // Save to localStorage with timestamp
    const stored = localStorage.getItem('dismissedBanners')
    const parsed = stored ? JSON.parse(stored) : {}
    parsed[bannerId] = Date.now()
    localStorage.setItem('dismissedBanners', JSON.stringify(parsed))
  }

  // Click handler
  const handleClick = async (banner: Banner) => {
    // Track click
    try {
      await fetch(`/api/banners/${banner.id}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'click' }),
      })
    } catch {}

    // Navigate to link
    if (banner.linkUrl) {
      window.open(banner.linkUrl, '_blank', 'noopener,noreferrer')
    }
  }

  if (loading || filteredBanners.length === 0) return null

  // Show only the highest priority banner
  const banner = filteredBanners[0]
  const style = BANNER_STYLES[banner.type as BannerType] || BANNER_STYLES.INFO
  const IconComponent = ICONS[style.icon] || Info

  const bgStyle = banner.backgroundColor ? { backgroundColor: banner.backgroundColor } : {}
  const textStyle = banner.textColor ? { color: banner.textColor } : {}

  return (
    <div
      className={cn(
        'relative z-50 w-full',
        position === 'TOP' ? 'sticky top-0' : 'fixed bottom-0',
        !banner.backgroundColor && style.bg,
        !banner.textColor && style.text,
        'shadow-lg',
        className
      )}
      style={{ ...bgStyle, ...textStyle }}
    >
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Image (if exists) */}
          {banner.imageUrl && (
            <div className="hidden sm:block flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="h-12 w-12 rounded-lg object-cover border-2 border-white/30"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            </div>
          )}
          
          {/* Icon and content */}
          <div className="flex flex-1 items-center gap-3">
            {!banner.imageUrl && <IconComponent className="h-5 w-5 flex-shrink-0" />}
            <div className="flex-1">
              <p className="font-medium">{banner.title}</p>
              {banner.content && (
                <p className="mt-0.5 text-sm opacity-90">{banner.content}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {banner.linkUrl && (
              <button
                onClick={() => handleClick(banner)}
                className={cn(
                  'flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium',
                  'bg-white/20 hover:bg-white/30 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-white/50'
                )}
              >
                {banner.linkText || 'Xem ngay'}
                <ExternalLink className="h-4 w-4" />
              </button>
            )}

            {banner.isDismissible && (
              <button
                onClick={() => handleDismiss(banner.id)}
                className={cn(
                  'rounded-full p-1 hover:bg-white/20 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-white/50'
                )}
                aria-label="Đóng thông báo"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Livestream animation */}
      {banner.type === 'LIVESTREAM' && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-white"></span>
          </span>
        </div>
      )}
    </div>
  )
}

export default AnnouncementBanner

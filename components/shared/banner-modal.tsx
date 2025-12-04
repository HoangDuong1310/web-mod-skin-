'use client'

import { useEffect, useState } from 'react'
import { X, ExternalLink, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Banner, BANNER_STYLES, BannerType } from '@/types/banner'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface BannerModalProps {
  className?: string
}

export function BannerModal({ className }: BannerModalProps) {
  const [modalBanner, setModalBanner] = useState<Banner | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const { status } = useSession()

  useEffect(() => {
    const fetchModalBanners = async () => {
      try {
        const res = await fetch('/api/banners?position=MODAL')
        if (res.ok) {
          const data = await res.json()
          const banners = data.banners || []

          // Check dismissed modal banners
          const stored = localStorage.getItem('dismissedModalBanners')
          const dismissed = stored ? JSON.parse(stored) : {}
          const now = Date.now()

          // Find first non-dismissed banner
          const banner = banners.find((b: Banner) => {
            // Check if dismissed within last 24 hours
            if (dismissed[b.id] && now - dismissed[b.id] < 24 * 60 * 60 * 1000) {
              return false
            }
            // Check audience
            if (b.targetAudience === 'AUTHENTICATED' && status !== 'authenticated') return false
            if (b.targetAudience === 'GUEST' && status === 'authenticated') return false
            return true
          })

          if (banner) {
            setModalBanner(banner)
            // Delay showing modal for better UX
            setTimeout(() => setIsOpen(true), 1000)
          }
        }
      } catch (error) {
        console.error('Error fetching modal banners:', error)
      }
    }

    if (status !== 'loading') {
      fetchModalBanners()
    }
  }, [status])

  const handleClose = () => {
    if (modalBanner) {
      // Save dismissed state
      const stored = localStorage.getItem('dismissedModalBanners')
      const dismissed = stored ? JSON.parse(stored) : {}
      dismissed[modalBanner.id] = Date.now()
      localStorage.setItem('dismissedModalBanners', JSON.stringify(dismissed))

      // Track view
      fetch(`/api/banners/${modalBanner.id}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'view' }),
      }).catch(() => {})
    }
    setIsOpen(false)
  }

  const handleClick = async () => {
    if (modalBanner) {
      // Track click
      try {
        await fetch(`/api/banners/${modalBanner.id}/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'click' }),
        })
      } catch {}

      if (modalBanner.linkUrl) {
        window.open(modalBanner.linkUrl, '_blank', 'noopener,noreferrer')
      }
    }
    handleClose()
  }

  if (!modalBanner) return null

  const style = BANNER_STYLES[modalBanner.type as BannerType] || BANNER_STYLES.INFO

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className={cn('sm:max-w-md', className)}
        style={{
          backgroundColor: modalBanner.backgroundColor || undefined,
          color: modalBanner.textColor || undefined,
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {modalBanner.type === 'LIVESTREAM' && (
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
              </span>
            )}
            {modalBanner.title}
          </DialogTitle>
        </DialogHeader>

        {modalBanner.imageUrl && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg">
            <img
              src={modalBanner.imageUrl}
              alt={modalBanner.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {modalBanner.content && (
          <p className="text-sm text-muted-foreground">{modalBanner.content}</p>
        )}

        <div className="flex gap-2">
          {modalBanner.linkUrl && (
            <Button onClick={handleClick} className="flex-1">
              <ExternalLink className="mr-2 h-4 w-4" />
              {modalBanner.linkText || 'Xem ngay'}
            </Button>
          )}
          {modalBanner.isDismissible && (
            <Button variant="outline" onClick={handleClose}>
              Để sau
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default BannerModal

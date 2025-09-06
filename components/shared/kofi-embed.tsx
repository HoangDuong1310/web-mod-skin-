'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    kofiWidgetOverlay?: {
      draw: (username: string, opts: Record<string, any>) => void
    }
  }
}

interface KofiEmbedProps {
  username: string
  buttonText?: string
  buttonBgColor?: string // e.g. #FF5F5F
  buttonTextColor?: string // e.g. #ffffff
}

// Injects Ko-fi official overlay widget (floating chat button).
// Draws once per mount to avoid duplicate widgets.
export function KofiEmbed({
  username,
  buttonText = 'Donate',
  buttonBgColor = '#FF5F5F',
  buttonTextColor = '#ffffff',
}: KofiEmbedProps) {
  const drawnRef = useRef(false)

  useEffect(() => {
    if (!username || drawnRef.current) return

    const draw = () => {
      try {
        window.kofiWidgetOverlay?.draw(username, {
          type: 'floating-chat',
          'floating-chat.donateButton.text': buttonText,
          'floating-chat.donateButton.background-color': buttonBgColor,
          'floating-chat.donateButton.text-color': buttonTextColor,
        })
        drawnRef.current = true
      } catch {
        // ignore
      }
    }

    if (window.kofiWidgetOverlay) {
      draw()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js'
    script.async = true
    script.onload = draw
    document.body.appendChild(script)

    return () => {
      // No official destroy API; best effort is to only draw once per mount.
    }
  }, [username, buttonText, buttonBgColor, buttonTextColor])

  return null
}

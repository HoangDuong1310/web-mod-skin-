'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

export function Live2DWidget() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Comprehensive error suppression for Live2D hitTest issues
    const originalError = console.error
    console.error = function(...args: any[]) {
      const errorString = String(args[0] || '')
      // Suppress Live2D related errors
      if (errorString.includes('hitTest') || 
          errorString.includes('Cannot read properties of null') ||
          errorString.includes('live2d')) {
        return
      }
      originalError.apply(console, args)
    }
    
    // Global error handler with capture phase
    const errorHandler = (event: ErrorEvent) => {
      const message = event.message || event.error?.message || ''
      if (message.includes('hitTest') || 
          message.includes('Cannot read properties of null') ||
          message.includes('reading \'hitTest\'')) {
        event.stopImmediatePropagation()
        event.stopPropagation()
        event.preventDefault()
        return false
      }
    }
    
    // Promise rejection handler
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const reason = String(event.reason)
      if (reason.includes('hitTest') || reason.includes('Cannot read properties of null')) {
        event.preventDefault()
        return false
      }
    }
    
    // Add handlers in capture phase for early interception
    window.addEventListener('error', errorHandler, true)
    window.addEventListener('unhandledrejection', rejectionHandler)
    
    return () => {
      console.error = originalError
      window.removeEventListener('error', errorHandler, true)
      window.removeEventListener('unhandledrejection', rejectionHandler)
    }
  }, [])

  if (!mounted) return null

  return (
    <>
      <Script
        src="/live2d-project/live2d-widget.js"
        strategy="afterInteractive"
        onError={() => {
          console.warn('[Live2D] Script failed to load')
        }}
      />
    </>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

export function Live2DWidget() {
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // Widget will be initialized by the script
    
    // Add global error handler for Live2D
    const errorHandler = (event: ErrorEvent) => {
      if (event.message && event.message.includes('hitTest')) {
        event.preventDefault()
        setHasError(true)
        // Retry after a delay
        setTimeout(() => {
          setHasError(false)
          if (typeof window !== 'undefined' && (window as any).initWidget) {
            // Attempting to reinitialize widget
          }
        }, 2000)
      }
    }
    
    window.addEventListener('error', errorHandler)
    
    return () => {
      window.removeEventListener('error', errorHandler)
    }
  }, [])

  if (hasError) {
    return null // Hide widget temporarily if error
  }

  return (
    <>
      {/* Load Live2D Widget Script */}
      <Script
        src="/live2d-project/live2d-widget.js"
        strategy="afterInteractive"
        onLoad={() => {
          setScriptLoaded(true)
        }}
        onError={(e) => {
          setHasError(true)
        }}
      />
    </>
  )
}

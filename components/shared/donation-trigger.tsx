'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDonationStore } from '@/hooks/use-donation-overlay'

interface DonationTriggerProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  showAfter?: number // seconds
  className?: string
}

export function DonationTrigger({ 
  position = 'bottom-right', 
  showAfter = 30,
  className 
}: DonationTriggerProps) {
  const { openOverlay, shouldShowOverlay } = useDonationStore()
  const [isVisible, setIsVisible] = useState(false)
  const [isPulsing, setIsPulsing] = useState(false)

  useEffect(() => {
    // Show trigger after specified time if conditions are met
    const timer = setTimeout(() => {
      if (shouldShowOverlay()) {
        setIsVisible(true)
        // Add pulsing animation after another 5 seconds (shorter than before)
        setTimeout(() => setIsPulsing(true), 5000)
      }
    }, showAfter * 1000)

    return () => clearTimeout(timer)
  }, [showAfter, shouldShowOverlay])

  // Check periodically if we should show the overlay
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isVisible && shouldShowOverlay()) {
        setIsVisible(true)
      }
    }, 30000) // Check every 30 seconds (more frequent)

    return () => clearInterval(interval)
  }, [isVisible, shouldShowOverlay])

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-6 left-6'
      case 'top-right':
        return 'top-6 right-6'
      case 'top-left':
        return 'top-6 left-6'
      default:
        return 'bottom-6 right-6'
    }
  }

  const handleClick = () => {
    setIsVisible(false)
    setIsPulsing(false)
    openOverlay()
  }

  if (!isVisible) return null

  return (
    <div className={`fixed z-40 ${getPositionClasses()} ${className}`}>
      <Button
        onClick={handleClick}
        size="lg"
        className={`
          bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600
          text-white shadow-lg transition-all duration-300 transform hover:scale-105
          ${isPulsing ? 'animate-pulse' : ''}
        `}
      >
        <Heart className="h-5 w-5 mr-2" />
        Support Us
      </Button>
      
      {/* Floating heart animation */}
      {isPulsing && (
        <div className="absolute -top-2 -right-2">
          <Heart className="h-4 w-4 text-red-500 animate-bounce" />
        </div>
      )}
    </div>
  )
}
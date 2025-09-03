'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface DownloadTimerProps {
  delaySeconds: number
  onDownloadReady: () => void
  isEnabled: boolean
  children?: React.ReactNode
}

export function DownloadTimer({ 
  delaySeconds, 
  onDownloadReady, 
  isEnabled,
  children 
}: DownloadTimerProps) {
  const [timeLeft, setTimeLeft] = useState(delaySeconds)
  const [isActive, setIsActive] = useState(false)
  const [isReady, setIsReady] = useState(!isEnabled)

  useEffect(() => {
    if (!isEnabled) {
      setIsReady(true)
      return
    }

    let interval: NodeJS.Timeout | null = null

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => {
          if (timeLeft <= 1) {
            setIsReady(true)
            setIsActive(false)
            toast.success('🎉 Download sẵn sàng!')
            return 0
          }
          return timeLeft - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, timeLeft, isEnabled])

  const startTimer = () => {
    if (!isEnabled) {
      onDownloadReady()
      return
    }
    
    setIsActive(true)
    toast.info(`⏱️ Vui lòng đợi ${delaySeconds} giây để có thể tải xuống`)
  }

  const handleDownload = () => {
    if (isReady) {
      onDownloadReady()
    } else {
      startTimer()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }
    return secs.toString()
  }

  if (!isEnabled) {
    return (
      <Button 
        size="lg" 
        className="w-full" 
        onClick={handleDownload}
      >
        <Download className="mr-2 h-4 w-4" />
        Download Now
      </Button>
    )
  }

  return (
    <div className="space-y-3">
      {!isActive && !isReady && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
            💡 <strong>Hãy dành thời gian khám phá nội dung!</strong><br/>
            Download sẽ khả dụng sau {delaySeconds} giây để đảm bảo bạn có đủ thông tin về sản phẩm.
          </p>
        </div>
      )}

      {isActive && !isReady && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
            <span className="text-lg font-mono font-bold text-blue-800 dark:text-blue-200">
              {formatTime(timeLeft)}
            </span>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Download sẽ khả dụng sau {formatTime(timeLeft)} giây...
          </p>
          <div className="mt-2 bg-blue-200 dark:bg-blue-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-linear"
              style={{ 
                width: `${((delaySeconds - timeLeft) / delaySeconds) * 100}%` 
              }}
            />
          </div>
        </div>
      )}

      <Button 
        size="lg" 
        className="w-full" 
        onClick={handleDownload}
        disabled={isActive && !isReady}
      >
        {isActive && !isReady ? (
          <>
            <Clock className="mr-2 h-4 w-4 animate-pulse" />
            Đợi {formatTime(timeLeft)}s...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            {isReady ? 'Download Now' : 'Chuẩn bị Download'}
          </>
        )}
      </Button>

      {children}
    </div>
  )
}
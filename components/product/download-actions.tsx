'use client'

import { Button } from '@/components/ui/button'
import { DownloadTimer } from '@/components/ui/download-timer'
import { ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface DownloadActionsProps {
  productId: string
  hasDownloadUrl: boolean
  hasExternalUrl: boolean
  className?: string
}

export default function DownloadActions({
  productId,
  hasDownloadUrl,
  hasExternalUrl,
  className = ""
}: DownloadActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [downloadSettings, setDownloadSettings] = useState({
    downloadDelayEnabled: true,
    downloadDelaySeconds: 30
  })

  // Load download settings on mount
  useEffect(() => {
    const loadDownloadSettings = async () => {
      try {
        const response = await fetch('/api/settings/download')
        if (response.ok) {
          const data = await response.json()
          setDownloadSettings(data)
        }
      } catch (error) {
        console.error('Error loading download settings:', error)
        // Keep defaults on error
      }
    }

    loadDownloadSettings()
  }, [])

  const handleDownload = async () => {
    if (!hasDownloadUrl && !hasExternalUrl) {
      toast.error('Download không khả dụng')
      return
    }

    try {
      setIsLoading(true)
      
      // Trigger download via API
      const response = await fetch(`/api/products/${productId}/download`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Failed to initiate download')
      }
      
      const data = await response.json()
      
      // Handle different response types
      if (data.redirect) {
        // External download - redirect to URL
        window.open(data.redirect, '_blank')
        toast.success('Đang chuyển hướng đến trang tải xuống...')
      } else if (data.downloadUrl || data.filename) {
        // Local file download
        const downloadUrl = data.downloadUrl || `/api/download/software/${data.filename}`
        const link = document.createElement('a')
        link.href = downloadUrl
        if (data.filename) {
          link.download = data.filename
        }
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.success('Bắt đầu tải xuống!')
      } else {
        toast.error('Không tìm thấy file để tải xuống')
      }
      
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Lỗi khi tải xuống. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewOnStore = () => {
    // This would redirect to app store/external store
    window.open('#', '_blank')
  }

  if (!hasDownloadUrl && !hasExternalUrl) {
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        <Button
          size="lg"
          className="w-full"
          disabled
        >
          Download không khả dụng
        </Button>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <DownloadTimer
        delaySeconds={downloadSettings.downloadDelaySeconds}
        isEnabled={downloadSettings.downloadDelayEnabled}
        onDownloadReady={handleDownload}
      >
        {isLoading && (
          <div className="text-center py-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-1">Đang xử lý...</p>
          </div>
        )}
      </DownloadTimer>
      
      <Button variant="outline" size="lg" className="w-full" onClick={handleViewOnStore}>
        <ExternalLink className="mr-2 h-4 w-4" />
        View on Store
      </Button>
    </div>
  )
}

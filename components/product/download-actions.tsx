'use client'

import { Button } from '@/components/ui/button'
import { Download, ExternalLink } from 'lucide-react'
import { useState } from 'react'
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
      if (data.redirectUrl) {
        // External download - redirect to URL
        window.open(data.redirectUrl, '_blank')
        toast.success('Đang chuyển hướng đến trang tải xuống...')
      } else if (data.downloadUrl) {
        // Local file download
        const link = document.createElement('a')
        link.href = data.downloadUrl
        link.download = data.filename
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
          <Download className="mr-2 h-4 w-4" />
          Download không khả dụng
        </Button>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <Button 
        size="lg" 
        className="w-full" 
        onClick={handleDownload}
        disabled={isLoading}
      >
        <Download className="mr-2 h-4 w-4" />
        {isLoading ? 'Đang tải...' : 'Download Now'}
      </Button>
      
      <Button variant="outline" size="lg" className="w-full" onClick={handleViewOnStore}>
        <ExternalLink className="mr-2 h-4 w-4" />
        View on Store
      </Button>
    </div>
  )
}

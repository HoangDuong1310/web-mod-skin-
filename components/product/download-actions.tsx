'use client'

import { Button } from '@/components/ui/button'
import { Download, ExternalLink } from 'lucide-react'
import { useState } from 'react'

interface DownloadActionsProps {
  downloadCount: number
  productId: string
  productTitle: string
  productSlug: string
}

export function DownloadActions({ downloadCount, productId, productTitle, productSlug }: DownloadActionsProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      
      // Get download info first
      const response = await fetch(`/api/products/${productId}/download-info`)
      
      if (!response.ok) {
        throw new Error('Failed to get download info')
      }
      
      const data = await response.json()
      
      // Create a temporary link to trigger download
      const link = document.createElement('a')
      link.href = data.downloadUrl
      link.download = data.filename
      link.style.display = 'none'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log('Download started for:', productTitle)
      
    } catch (error) {
      console.error('Download failed:', error)
      alert('Download failed. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleViewOnStore = () => {
    // Redirect to product page if needed or external store
    window.open(`/products/${productSlug}`, '_blank')
  }

  return (
    <>
      <Button 
        size="lg" 
        className="w-full" 
        onClick={handleDownload}
        disabled={isDownloading}
      >
        <Download className="w-5 h-5 mr-2" />
        {isDownloading ? 'Downloading...' : 'Download Now'}
      </Button>
      
      <Button variant="outline" size="lg" className="w-full" onClick={handleViewOnStore}>
        <ExternalLink className="w-5 h-5 mr-2" />
        View on Store
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        {downloadCount.toLocaleString()} downloads
      </div>
    </>
  )
}

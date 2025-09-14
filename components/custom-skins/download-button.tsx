'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

interface DownloadButtonProps {
  skinId: string
}

export function DownloadButton({ skinId }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    // No authentication required for downloads - public access for approved skins
    setIsDownloading(true)
    
    try {
      // First, verify the skin exists and get download URL
      const downloadUrl = `${window.location.origin}/api/custom-skins/${skinId}/download`
      
      // Try to open local application with custom protocol
      // The app will receive the download URL to handle the actual download
      const appProtocol = `skinmod://download?url=${encodeURIComponent(downloadUrl)}&skinId=${skinId}`
      
      try {
        // Attempt to open local application
        window.location.href = appProtocol
        toast.success('Opening in Skin Mod application...')
        
        // Show fallback option after a delay
        setTimeout(() => {
          toast.info('App not found? Click here for direct download', {
            action: {
              label: 'Direct Download',
              onClick: () => handleDirectDownload()
            },
            duration: 10000
          })
        }, 2000)
        
      } catch (error) {
        console.log('Custom protocol failed, falling back to direct download')
        await handleDirectDownload()
      }
      
    } catch (error) {
      console.error('Download error:', error)
      toast.error(error instanceof Error ? error.message : 'Download failed')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDirectDownload = async () => {
    try {
      const response = await fetch(`/api/custom-skins/${skinId}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Download failed')
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `skin-${skinId}.zip`

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Download started successfully!')
    } catch (error) {
      console.error('Direct download error:', error)
      toast.error(error instanceof Error ? error.message : 'Download failed')
    }
  }

  return (
    <Button 
      onClick={handleDownload} 
      disabled={isDownloading}
      className="w-full"
      size="lg"
    >
      <Download className="h-4 w-4 mr-2" />
      {isDownloading ? 'Processing...' : 'Open in App'}
    </Button>
  )
}

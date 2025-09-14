'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface DownloadInfoProps {
  skinId: string
}

export function DownloadInfo({ skinId }: DownloadInfoProps) {
  const [showUrl, setShowUrl] = useState(false)
  
  const downloadUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/custom-skins/${skinId}/download`
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(downloadUrl)
      toast.success('Download URL copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy URL')
    }
  }

  const openDirectDownload = () => {
    window.open(downloadUrl, '_blank')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUrl(!showUrl)}
        >
          {showUrl ? 'Hide' : 'Show'} Download URL
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={openDirectDownload}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Direct Download
        </Button>
      </div>
      
      {showUrl && (
        <div className="space-y-2">
          <Label htmlFor="download-url" className="text-sm text-muted-foreground">
            Download URL (for applications):
          </Label>
          <div className="flex gap-2">
            <Input
              id="download-url"
              value={downloadUrl}
              readOnly
              className="font-mono text-xs"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={copyToClipboard}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This URL can be used by external applications to download the skin file directly.
          </p>
        </div>
      )}
    </div>
  )
}
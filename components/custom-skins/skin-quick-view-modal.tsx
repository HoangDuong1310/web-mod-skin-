'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Download, 
  Heart, 
  Share2, 
  Eye, 
  Calendar,
  User,
  Package,
  Star,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Copy,
  Check,
  Sparkles
} from 'lucide-react'
import { cn, getChampionIconUrl } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

interface SkinQuickViewModalProps {
  skin: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SkinQuickViewModal({ skin, open, onOpenChange }: SkinQuickViewModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [copied, setCopied] = useState(false)
  const [imageZoom, setImageZoom] = useState(false)

  if (!skin) return null

  // Parse preview images
  const previewImages = skin.previewImages 
    ? typeof skin.previewImages === 'string'
      ? JSON.parse(skin.previewImages)
      : skin.previewImages
    : []

  const allImages = [
    skin.thumbnailImage,
    ...previewImages
  ].filter(Boolean)

  const handleCopyLink = () => {
    const url = `${window.location.origin}/custom-skins/${skin.id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenInApp = async () => {
    try {
      // Get download URL
      const downloadUrl = `${window.location.origin}/api/custom-skins/${skin.id}/download`
      
      // Try to open local application with custom protocol
      const appProtocol = `skinmod://download?url=${encodeURIComponent(downloadUrl)}&skinId=${skin.id}`
      
      // Attempt to open local application
      window.location.href = appProtocol
      
      // Close modal after opening app
      onOpenChange(false)
      
    } catch (error) {
      console.error('Open in app error:', error)
      // Fallback to direct download
      window.open(`/api/custom-skins/${skin.id}/download`, '_blank')
    }
  }

  const handleDirectDownload = async () => {
    try {
      const response = await fetch(`/api/custom-skins/${skin.id}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.downloadUrl) {
          window.open(data.downloadUrl, '_blank')
        }
      } else {
        throw new Error('Download failed')
      }
    } catch (error) {
      console.error('Download error:', error)
      window.open(`/api/custom-skins/${skin.id}/download`, '_blank')
    }
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          {/* Image Gallery */}
          <div className="relative bg-black flex flex-col">
            {/* Main Image */}
            <div className="relative flex-1 flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="relative w-full h-full cursor-zoom-in"
                  onClick={() => setImageZoom(!imageZoom)}
                >
                  <img
                    src={allImages[currentImageIndex] || '/default-skin.svg'}
                    alt={skin.name}
                    className={cn(
                      "w-full h-full object-contain transition-transform duration-300",
                      imageZoom && "scale-150"
                    )}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/default-skin.svg'
                    }}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </>
              )}

              {/* Zoom Indicator */}
              <div className="absolute top-4 right-4 p-2 rounded-full bg-white/10 backdrop-blur-sm">
                <ZoomIn className="w-5 h-5 text-white" />
              </div>

              {/* Image Counter */}
              {allImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm">
                  <span className="text-white text-sm">
                    {currentImageIndex + 1} / {allImages.length}
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {allImages.length > 1 && (
              <div className="border-t border-white/10 p-2 bg-black/50">
                <div className="flex gap-2 overflow-x-auto">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        "relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all",
                        index === currentImageIndex 
                          ? "border-primary" 
                          : "border-transparent hover:border-white/30"
                      )}
                    >
                      <img
                        src={image || '/default-skin.svg'}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/default-skin.svg'
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-col h-full overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <DialogTitle className="text-2xl font-bold">
                    {skin.name}
                  </DialogTitle>
                  
                  {/* Champion and Category */}
                  <div className="flex items-center gap-3">
                    {skin.champion && (
                      <div className="flex items-center gap-2">
                        <img
                          src={skin.champion.alias ? getChampionIconUrl(skin.champion.alias) : '/default-avatar.svg'}
                          alt={skin.champion.name}
                          className="w-6 h-6 rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/default-avatar.svg'
                          }}
                        />
                        <span className="font-medium">{skin.champion.name}</span>
                      </div>
                    )}
                    {skin.category && (
                      <Badge variant="secondary">
                        {skin.category.name}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                {skin.status === 'FEATURED' && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                    Featured
                  </Badge>
                )}
              </div>
            </DialogHeader>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="stats">Stats</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  {/* Description */}
                  <div className="space-y-2">
                    <h3 className="font-semibold">Description</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {skin.description || 'No description available.'}
                    </p>
                  </div>

                  {/* Author Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold">Author</h3>
                    <div className="flex items-center gap-3">
                      <img
                        src={skin.author?.image || '/default-avatar.svg'}
                        alt={skin.author?.name || ''}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/default-avatar.svg'
                        }}
                      />
                      <div>
                        <p className="font-medium">
                          {skin.author?.name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded {formatDistanceToNow(new Date(skin.createdAt), { 
                            addSuffix: true,
                            locale: vi 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsLiked(!isLiked)}
                      className="gap-2"
                    >
                      <Heart 
                        className={cn(
                          "w-4 h-4",
                          isLiked && "fill-red-500 text-red-500"
                        )} 
                      />
                      {isLiked ? 'Liked' : 'Like'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4" />
                          Share
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Version</p>
                      <p className="font-medium">{skin.version || '1.0'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">File Type</p>
                      <p className="font-medium">{skin.fileType || 'ZIP'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">File Size</p>
                      <p className="font-medium">{skin.fileSize || 'Unknown'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {new Date(skin.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="stats" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4 border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {skin.downloadCount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Downloads</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4 border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                          <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {skin.status === 'FEATURED' ? '⭐' : '4.8'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {skin.status === 'FEATURED' ? 'Featured' : 'Rating'}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Additional Stats */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge 
                        variant={skin.status === 'FEATURED' ? 'default' : 'secondary'}
                        className={skin.status === 'FEATURED' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : ''}
                      >
                        {skin.status || 'APPROVED'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">File Type:</span>
                      <span className="font-medium">{skin.fileType || 'ZIP'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">File Size:</span>
                      <span className="font-medium">{skin.fileSize || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium">{skin.category?.name || 'Uncategorized'}</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Footer Actions */}
            <div className="border-t px-6 py-4">
              <div className="flex gap-2">
                <Button 
                  className="flex-1 gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  size="lg"
                  onClick={handleOpenInApp}
                >
                  <Sparkles className="w-5 h-5" />
                  Open AinzSkin
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={handleDirectDownload}
                  className="gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download
                </Button>
                <Link href={`/custom-skins/${skin.id}`}>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="gap-2"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Details
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Missing Card component import
import { Card } from '@/components/ui/card'

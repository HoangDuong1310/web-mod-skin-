'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Download, 
  Eye, 
  Heart, 
  Star, 
  User, 
  Calendar,
  Sparkles,
  TrendingUp,
  Award,
  Clock,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, getChampionIconUrl } from '@/lib/utils'
import { processPreviewImages, convertToApiUrl, getBestSkinImage } from '@/lib/image-utils'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

interface EnhancedSkinCardProps {
  skin: {
    id: string
    name: string
    description?: string
    thumbnailImage?: string | null
    previewImages?: string | string[]
    downloadCount: number
    status?: string
    createdAt: string | Date
    champion?: {
      name: string
      alias?: string
      squarePortraitPath?: string
    }
    category?: {
      name: string
      slug?: string
    }
    author?: {
      name: string | null
      image?: string | null
    }
  }
  featured?: boolean
  onQuickView?: (skin: any) => void
  className?: string
}

export function EnhancedSkinCard({ 
  skin, 
  featured = false,
  onQuickView,
  className 
}: EnhancedSkinCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [championIconLoaded, setChampionIconLoaded] = useState(false)
  const [championAvatarLoaded, setChampionAvatarLoaded] = useState(false)

  // Use utility functions for image processing
  const previewImages = processPreviewImages(skin.previewImages)
  const thumbnailImage = convertToApiUrl(skin.thumbnailImage)
  const displayImage = getBestSkinImage(skin)

  // Reset champion icon state when champion changes
  useEffect(() => {
    setChampionIconLoaded(false)
    setChampionAvatarLoaded(false)
  }, [skin.champion?.alias])

  // Auto-rotate images on hover
  useEffect(() => {
    if (isHovered && previewImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % previewImages.length)
      }, 2000)
      return () => clearInterval(interval)
    } else {
      setCurrentImageIndex(0)
    }
  }, [isHovered, previewImages.length])

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsLiked(!isLiked)
    // TODO: Call API to save like
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onQuickView?.(skin)
  }

  const handleOpenInApp = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      // Get download URL
      const downloadUrl = `${window.location.origin}/api/custom-skins/${skin.id}/download`
      
      // Try to open local application with custom protocol
      const appProtocol = `skinmod://download?url=${encodeURIComponent(downloadUrl)}&skinId=${skin.id}`
      
      // Attempt to open local application
      window.location.href = appProtocol
      
      // Show success message
      // toast.success('Opening in AinzSkin application...')
      
      // Show fallback option after a delay
      setTimeout(() => {
        // toast.info('App not found? Click here for direct download', {
        //   action: {
        //     label: 'Direct Download',
        //     onClick: () => window.open(downloadUrl, '_blank')
        //   },
        //   duration: 10000
        // })
      }, 2000)
      
    } catch (error) {
      console.error('Open in app error:', error)
      // Fallback to direct download
      window.open(`/api/custom-skins/${skin.id}/download`, '_blank')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={className}
    >
      <Card className={cn(
        "group relative overflow-hidden border-2 transition-all duration-300",
        featured && "border-yellow-400/50 shadow-[0_0_20px_rgba(251,191,36,0.15)]",
        isHovered && "border-primary/50 shadow-xl"
      )}>
        {/* Featured Badge */}
        {featured && (
          <div className="absolute top-3 left-3 z-20">
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 px-3 py-1 shadow-lg">
              <Sparkles className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          </div>
        )}

        {/* Status Badge */}
        {skin.status === 'FEATURED' && (
          <div className="absolute top-3 right-3 z-20">
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
              <Award className="w-3 h-3 mr-1" />
              Hot
            </Badge>
          </div>
        )}

         {/* Action Buttons */}
         <div className="absolute top-3 right-3 z-20 flex gap-2">
           {/* Open AinzSkin Button - Primary Action */}
           <button
             onClick={handleOpenInApp}
             className="px-3 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white backdrop-blur-sm transition-all hover:scale-105 shadow-lg flex items-center gap-1"
             aria-label="Open in AinzSkin app"
             title="Open in AinzSkin Local App"
           >
             <Sparkles className="w-4 h-4" />
             <span className="text-xs font-medium hidden sm:inline">AinzSkin</span>
           </button>
           
           {/* Quick View Button */}
           <button
             onClick={handleQuickView}
             className="p-2 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-sm transition-all hover:scale-110 hover:bg-primary/90 hover:text-white"
             aria-label="Quick view skin"
           >
             <Eye className="w-4 h-4" />
           </button>
           
           {/* Like Button */}
           <button
             onClick={handleLike}
             className="p-2 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-sm transition-all hover:scale-110"
             aria-label="Like skin"
           >
             <Heart 
               className={cn(
                 "w-4 h-4 transition-all",
                 isLiked 
                   ? "fill-red-500 text-red-500" 
                   : "text-gray-600 dark:text-gray-400"
               )} 
             />
           </button>
         </div>

        {/* Image Container */}
        <Link href={`/custom-skins/${skin.id}`} className="block">
          <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
            {/* Champion Portrait Background */}
            {skin.champion?.alias && (
              <div className="absolute inset-0 opacity-20">
                <img
                  src={getChampionIconUrl(skin.champion.alias)}
                  alt=""
                  className="w-full h-full object-cover blur-xl"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/default-avatar.svg'
                  }}
                />
              </div>
            )}

            {/* Champion Icon Overlay */}
            {skin.champion?.alias && (
              <div className="absolute top-2 left-2 z-10">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-lg bg-primary/10">
                  <img
                    src={getChampionIconUrl(skin.champion.alias)}
                    alt={skin.champion.name}
                    className="w-full h-full object-cover"
                    onLoad={() => setChampionIconLoaded(true)}
                    onError={() => setChampionIconLoaded(false)}
                    style={{ display: championIconLoaded ? 'block' : 'none' }}
                  />
                  {/* Fallback div - only show when icon fails */}
                  {!championIconLoaded && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {skin.champion.name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Main Image */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative w-full h-full"
              >
                <img
                  src={previewImages[currentImageIndex] || displayImage}
                  alt={skin.name}
                  className={cn(
                    "w-full h-full object-cover transition-all duration-500",
                    imageLoaded ? "opacity-100" : "opacity-0"
                  )}
                  onLoad={() => setImageLoaded(true)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/default-skin.svg'
                  }}
                />
              </motion.div>
            </AnimatePresence>

            {/* Image Indicators */}
            {previewImages.length > 1 && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 z-10">
                {previewImages.map((_: any, index: number) => (
                  <div
                    key={index}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      index === currentImageIndex 
                        ? "bg-white w-4" 
                        : "bg-white/50"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Hover Overlay */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-4"
                >
                   <div className="flex gap-2 w-full">
                     <Button
                       size="sm"
                       className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 backdrop-blur-sm text-white border-0"
                       onClick={handleOpenInApp}
                     >
                       <Sparkles className="w-4 h-4 mr-1" />
                       Open AinzSkin
                     </Button>
                     <Button
                       size="sm"
                       variant="secondary"
                       className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-white/30"
                       onClick={handleQuickView}
                     >
                       <Eye className="w-4 h-4" />
                     </Button>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Link>

        <CardContent className="p-4 space-y-3">
          {/* Title and Champion */}
          <div className="space-y-1">
            <Link 
              href={`/custom-skins/${skin.id}`}
              className="block group/title"
            >
              <h3 className="font-bold text-lg line-clamp-1 group-hover/title:text-primary transition-colors">
                {skin.name}
              </h3>
            </Link>
            
             {skin.champion && (
               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                 <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-primary/20 bg-primary/10 relative">
                   <img
                     src={skin.champion.alias ? getChampionIconUrl(skin.champion.alias) : '/default-avatar.svg'}
                     alt={skin.champion.name}
                     className="w-full h-full object-cover"
                     onLoad={() => setChampionAvatarLoaded(true)}
                     onError={() => setChampionAvatarLoaded(false)}
                     style={{ display: championAvatarLoaded ? 'block' : 'none' }}
                   />
                   {/* Fallback - only show when icon fails */}
                   {!championAvatarLoaded && (
                     <div className="absolute inset-0 bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                       {skin.champion.name.charAt(0)}
                     </div>
                   )}
                 </div>
                 <span className="font-medium">{skin.champion.name}</span>
               </div>
             )}
          </div>

          {/* Description */}
          {skin.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {skin.description}
            </p>
          )}

          {/* Stats Row */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              {/* Downloads */}
              <div className="flex items-center gap-1 text-muted-foreground">
                <Download className="w-3.5 h-3.5" />
                <span>{skin.downloadCount.toLocaleString()}</span>
              </div>

              {/* Category */}
              {skin.category && (
                <Badge variant="secondary" className="text-xs">
                  {skin.category.name}
                </Badge>
              )}
            </div>

            {/* Trending Indicator */}
            {skin.downloadCount > 100 && (
              <Badge variant="outline" className="text-xs border-green-500/50 text-green-600 dark:text-green-400">
                <TrendingUp className="w-3 h-3 mr-1" />
                Trending
              </Badge>
            )}
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
            {/* Author */}
            <div className="flex items-center gap-2">
              <img
              src={skin.author?.image || '/default-avatar.svg'}
              alt={skin.author?.name || ''}
              className="w-5 h-5 rounded-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/default-avatar.svg'
              }}
            />
              <span className="font-medium">
                {skin.author?.name || 'Anonymous'}
              </span>
            </div>

            {/* Time */}
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>
                {formatDistanceToNow(new Date(skin.createdAt), { 
                  addSuffix: true,
                  locale: vi 
                })}
              </span>
            </div>
          </div>

          {/* View Details Link */}
          <Link
            href={`/custom-skins/${skin.id}`}
            className="group/link flex items-center justify-center gap-2 pt-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <span>Xem chi tiết</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  )
}

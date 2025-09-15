import Image from 'next/image'
import Link from 'next/link'
import { CustomSkin } from '@/types/custom-skins'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Download, Eye, User } from 'lucide-react'
import { getChampionIconUrl, getSkinThumbnailUrl } from '@/lib/utils'

interface SkinCardProps {
  skin: CustomSkin
}

export default function SkinCard({ skin }: SkinCardProps) {
  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'ZIP':
        return 'bg-blue-500'
      case 'RAR':
        return 'bg-green-500'
      case 'FANTOME':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Generate champion icon URL
  const getChampionIcon = (championAlias?: string) => {
    if (!championAlias) return null
    return getChampionIconUrl(championAlias)
  }

  // Get skin thumbnail image
  const getSkinThumbnail = () => {
    // Use first preview image or fallback to thumbnailImage
    const firstPreviewImage = skin.previewImages && skin.previewImages.length > 0 
      ? skin.previewImages[0] 
      : skin.thumbnailImage
    return getSkinThumbnailUrl(firstPreviewImage)
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-300 group">
      <CardContent className="p-0">
        {/* Skin Thumbnail */}
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          {getSkinThumbnail() !== '/placeholder-image.svg' ? (
            <img
              src={getSkinThumbnail()}
              alt={skin.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center">
              <span className="text-foreground text-lg font-semibold">
                {skin.name.charAt(0)}
              </span>
            </div>
          )}
          
          {/* Champion Icon Overlay */}
          {skin.champion?.alias && getChampionIcon(skin.champion.alias) && (
            <div className="absolute top-2 left-2">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-lg">
                <Image
                  src={getChampionIcon(skin.champion.alias)!}
                  alt={skin.champion.name}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    // Fallback to initial if champion icon fails
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
                {/* Fallback div if image fails */}
                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {skin.champion.name.charAt(0)}
                </div>
              </div>
            </div>
          )}
          
          {/* File Type Badge */}
          <div className="absolute top-2 right-2">
            <Badge className={`${getFileTypeColor(skin.fileType)} text-white border-0`}>
              {skin.fileType}
            </Badge>
          </div>
        </div>

        {/* Skin Info */}
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">
            {skin.name}
          </h3>
          
          <p className="text-sm text-muted-foreground mb-2">
            {skin.champion.name} • {skin.category.name}
          </p>
          
          <p className="text-sm line-clamp-2 mb-3">
            {skin.description}
          </p>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{skin.author.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              <span>{skin.downloadCount}</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link href={`/custom-skins/${skin.id}` as any}>
            <Eye className="w-4 h-4 mr-1" />
            View
          </Link>
        </Button>
        
        <Button asChild size="sm" className="flex-1">
          <Link href={`/custom-skins/${skin.id}?download=true` as any}>
            <Download className="w-4 h-4 mr-1" />
            Download
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
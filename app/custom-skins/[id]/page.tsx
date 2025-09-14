import { notFound } from 'next/navigation'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { getImageUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Download, FileText, Gauge, User } from 'lucide-react'
import { DownloadButton } from '@/components/custom-skins/download-button'
import { DownloadInfo } from '@/components/custom-skins/download-info'

interface PageProps {
  params: {
    id: string
  }
}

async function getSkinDetail(id: string) {
  try {
    const skin = await (prisma as any).customSkin.findUnique({
      where: {
        id,
        status: 'APPROVED',
        deletedAt: null
      },
      include: {
        champion: {
          select: {
            id: true,
            name: true,
            alias: true,
            squarePortraitPath: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        author: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return skin
  } catch (error) {
    console.error('Error fetching skin detail:', error)
    return null
  }
}

export default async function SkinDetailPage({ params }: PageProps) {
  const skin = await getSkinDetail(params.id)

  if (!skin) {
    notFound()
  }

  const previewImages = skin.previewImages ? JSON.parse(skin.previewImages) : []
  const primaryImage = skin.thumbnailImage || previewImages[0] || '/placeholder-image.svg'

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>Custom Skins</span>
            <span>/</span>
            <span>{skin.champion?.name}</span>
            <span>/</span>
            <span className="text-foreground">{skin.name}</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {skin.name}
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Image Gallery */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Primary Image */}
                <div className="relative aspect-video bg-muted">
                  <Image
                    src={getImageUrl(primaryImage)}
                    alt={skin.name}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                
                {/* Preview Images */}
                {previewImages.length > 1 && (
                  <div className="p-4">
                    <h3 className="font-semibold mb-3">Preview Images</h3>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {previewImages.map((imagePath: string, index: number) => (
                        <div key={index} className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                          <Image
                            src={getImageUrl(imagePath)}
                            alt={`${skin.name} preview ${index + 1}`}
                            fill
                            className="object-cover hover:scale-105 transition-transform cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Skin Info */}
          <div className="space-y-6">
            {/* Basic Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Skin Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Champion */}
                <div className="flex items-center gap-3">
                  {skin.champion?.squarePortraitPath && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                      <Image
                        src={getImageUrl(skin.champion.squarePortraitPath)}
                        alt={skin.champion.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{skin.champion?.name}</p>
                    <p className="text-sm text-muted-foreground">Champion</p>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Category</p>
                  <Badge variant="secondary">{skin.category?.name}</Badge>
                </div>

                {/* Version */}
                {skin.version && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Version</p>
                    <Badge variant="outline">{skin.version}</Badge>
                  </div>
                )}

                {/* Author */}
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">by {skin.author?.name}</span>
                </div>

                {/* Download Count */}
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{skin.downloadCount} downloads</span>
                </div>

                {/* Upload Date */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(skin.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Download Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Download
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p><strong>File:</strong> {skin.fileName}</p>
                  <p><strong>Size:</strong> {(skin.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
                  <p><strong>Type:</strong> {skin.fileType.toUpperCase()}</p>
                </div>
                
                <div className="space-y-4">
                  <DownloadButton skinId={skin.id} />
                  <DownloadInfo skinId={skin.id} />
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {skin.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {skin.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const skin = await getSkinDetail(params.id)

  if (!skin) {
    return {
      title: 'Skin not found'
    }
  }

  return {
    title: `${skin.name} - ${skin.champion?.name} Custom Skin`,
    description: skin.description || `Download ${skin.name} custom skin for ${skin.champion?.name}`,
  }
}

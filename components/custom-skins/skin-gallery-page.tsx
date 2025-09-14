'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Download, Search, Filter, X, Calendar, User, FileText } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { format } from 'date-fns'
import Image from 'next/image'
import { getImageUrl } from '@/lib/utils'
import CustomSkinsBreadcrumb from './custom-skins-breadcrumb'

interface SkinSubmission {
  id: string
  name: string
  description: string
  version: string
  championId: number
  categoryId: string
  authorId: string
  fileName: string
  filePath: string
  fileSize: string
  fileType: string
  previewImages: string[]
  thumbnailImage: string | null
  status: string
  downloadCount: number
  createdAt: string
  updatedAt: string
  champion: {
    name: string
    alias: string
    squarePortraitPath: string
  }
  category: {
    name: string
    slug: string
  }
  author: {
    name: string
    image: string | null
  }
}

interface GalleryResponse {
  submissions: SkinSubmission[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface Champion {
  id: number
  name: string
  alias: string
  squarePortraitPath: string
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function SkinGalleryPage() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [skins, setSkins] = useState<SkinSubmission[]>([])
  const [champions, setChampions] = useState<Champion[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedChampion, setSelectedChampion] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPage, setCurentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchSkins = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (searchTerm) params.append('search', searchTerm)
      if (selectedChampion && selectedChampion !== 'all') params.append('championId', selectedChampion)
      if (selectedCategory && selectedCategory !== 'all') params.append('categoryId', selectedCategory)
      params.append('page', currentPage.toString())
      params.append('limit', '12')

      const response = await fetch(`/api/custom-skins/my-gallery?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch skins')
      }

      const data = await response.json()
      setSkins(data.skins || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotal(data.pagination?.total || 0)
    } catch (error) {
      console.error('Error fetching skins:', error)
      toast.error('Failed to load skins')
    } finally {
      setLoading(false)
    }
  }

  const fetchChampions = async () => {
    try {
      const response = await fetch('/api/champions')
      if (response.ok) {
        const data = await response.json()
        setChampions(data.champions || [])
      }
    } catch (error) {
      console.error('Error fetching champions:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/custom-skins/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  useEffect(() => {
    fetchChampions()
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchSkins()
  }, [searchTerm, selectedChampion, selectedCategory, currentPage])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurentPage(1)
    fetchSkins()
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedChampion('all')
    setSelectedCategory('all')
    setCurentPage(1)
  }

  const handleDownload = async (skin: SkinSubmission) => {
    // No authentication required for downloads - public access for approved skins
    try {
      const response = await fetch(`/api/custom-skins/${skin.id}/download`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Download failed')
      }

      // Trigger file download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = skin.fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Download started!')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Download failed')
    }
  }

  const formatFileSize = (sizeStr: string) => {
    const size = parseInt(sizeStr)
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <>
      <CustomSkinsBreadcrumb />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Custom Skins Gallery</h1>
        <p className="text-muted-foreground">
          View and manage your approved custom skins
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search skins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <div className="flex flex-wrap gap-4">
          <Select value={selectedChampion} onValueChange={setSelectedChampion}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Champions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Champions</SelectItem>
              {champions.map((champion) => (
                <SelectItem key={champion.id} value={champion.id.toString()}>
                  {champion.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(searchTerm || selectedChampion !== 'all' || selectedCategory !== 'all') && (
            <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {skins.length} of {total} skins
        </div>
      </div>

      {/* Skins Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-muted rounded mb-4" />
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : skins.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No skins found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters to find skins
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {skins.map((skin) => (
            <Card key={skin.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{skin.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Image
                        src={getImageUrl(skin.champion.squarePortraitPath)}
                        alt={skin.champion.name}
                        width={20}
                        height={20}
                        className="rounded"
                      />
                      {skin.champion.name}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {skin.category.name}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Preview Image */}
                <div className="relative h-32 bg-muted rounded-lg overflow-hidden">
                  {skin.thumbnailImage || (skin.previewImages && skin.previewImages.length > 0) ? (
                    <Image
                      src={getImageUrl(skin.thumbnailImage || skin.previewImages[0])}
                      alt={skin.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <FileText className="h-8 w-8" />
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {skin.description}
                </p>

                {/* Author and Date */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={skin.author.image || undefined} />
                      <AvatarFallback>
                        {skin.author.name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span>{skin.author.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(skin.createdAt), 'MMM dd')}
                  </div>
                </div>

                {/* File Info and Download */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    <div>v{skin.version}</div>
                    <div>{formatFileSize(skin.fileSize)}</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(skin)}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 gap-2">
          <Button
            variant="outline"
            onClick={() => setCurentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || loading}
          >
            Previous
          </Button>
          
          {[...Array(totalPages)].map((_, i) => {
            const page = i + 1
            if (
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 2 && page <= currentPage + 2)
            ) {
              return (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  onClick={() => setCurentPage(page)}
                  disabled={loading}
                >
                  {page}
                </Button>
              )
            } else if (page === currentPage - 3 || page === currentPage + 3) {
              return <span key={page} className="px-2">...</span>
            }
            return null
          })}
          
          <Button
            variant="outline"
            onClick={() => setCurentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}
      </div>
    </>
  )
}

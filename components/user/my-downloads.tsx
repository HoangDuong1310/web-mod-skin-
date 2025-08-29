'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, Star, Calendar, Package } from 'lucide-react'
import Link from 'next/link'

interface DownloadHistory {
  id: string
  softwareName: string
  softwareSlug: string
  softwareId?: string
  category: string
  downloadDate: string
  version: string
  size: string
  averageRating: number
  totalReviews: number
}

interface DownloadStats {
  totalDownloads: number
  uniqueSoftware: number
  lastDownload: string
  favoriteCategory: string
}

export default function MyDownloads() {
  const [downloads, setDownloads] = useState<DownloadHistory[]>([])
  const [stats, setStats] = useState<DownloadStats>({
    totalDownloads: 0,
    uniqueSoftware: 0,
    lastDownload: '',
    favoriteCategory: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDownloads()
  }, [])

  const fetchDownloads = async () => {
    try {
      setLoading(true)
      
      // Fetch user's download history
      const response = await fetch('/api/user/downloads')
      if (response.ok) {
        const data = await response.json()
        setDownloads(data.downloads || [])
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error('Error fetching downloads:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleRedownload = async (download: DownloadHistory) => {
    try {
      // If we have softwareId, use it directly. Otherwise, redirect to product page
      if (download.softwareId) {
        // Get download info using the product ID
        const response = await fetch(`/api/products/${download.softwareId}/download-info`)
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
      } else {
        // Fallback: redirect to product page for direct download
        window.open(`/products/${download.softwareSlug}`, '_blank')
      }
      
    } catch (error) {
      console.error('Error redownloading:', error)
      alert('Download failed. Please try again or visit the product page.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Downloads</h1>
        <p className="text-muted-foreground">Manage and re-download your software</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDownloads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Software</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.uniqueSoftware}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favorite Category</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-yellow-600">{stats.favoriteCategory || 'N/A'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Download</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-green-600">
              {stats.lastDownload ? formatDate(stats.lastDownload) : 'Never'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Downloads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Download History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Software</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Download Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      Loading downloads...
                    </TableCell>
                  </TableRow>
                ) : downloads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <div className="text-center space-y-2">
                        <Download className="h-12 w-12 text-muted-foreground mx-auto" />
                        <p className="text-muted-foreground">No downloads yet</p>
                        <Link href="/products">
                          <Button variant="outline">Browse Software</Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  downloads.map((download) => (
                    <TableRow key={download.id}>
                      <TableCell>
                        <div className="font-medium">{download.softwareName}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{download.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-1 py-0.5 rounded">
                          {download.version}
                        </code>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {download.size}
                      </TableCell>
                      <TableCell>
                        {download.totalReviews > 0 ? (
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm">
                              {Number(download.averageRating).toFixed(1)} ({download.totalReviews})
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No reviews</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(download.downloadDate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRedownload(download)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <Link href={`/products/${download.softwareSlug}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

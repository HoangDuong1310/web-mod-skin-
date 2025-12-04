'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Radio,
  Gift,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Info,
  MousePointer,
  BarChart3,
  Smartphone,
  Monitor,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Banner,
  BannerType,
  BANNER_TYPE_LABELS,
  BANNER_POSITION_LABELS,
} from '@/types/banner'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

const TYPE_ICONS: Record<BannerType, React.ComponentType<{ className?: string }>> = {
  INFO: Info,
  LIVESTREAM: Radio,
  PROMOTION: Gift,
  WARNING: AlertTriangle,
  SUCCESS: CheckCircle,
  EVENT: Calendar,
}

const TYPE_COLORS: Record<BannerType, string> = {
  INFO: 'bg-blue-100 text-blue-800',
  LIVESTREAM: 'bg-red-100 text-red-800',
  PROMOTION: 'bg-purple-100 text-purple-800',
  WARNING: 'bg-yellow-100 text-yellow-800',
  SUCCESS: 'bg-green-100 text-green-800',
  EVENT: 'bg-orange-100 text-orange-800',
}

export default function BannersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/banners?mode=manage')
      if (res.ok) {
        const data = await res.json()
        setBanners(data.banners || [])
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách banner',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBanners()
  }, [])

  const handleToggleActive = async (banner: Banner) => {
    try {
      const res = await fetch(`/api/banners/${banner.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !banner.isActive }),
      })

      if (res.ok) {
        toast({
          title: 'Thành công',
          description: `Banner đã được ${!banner.isActive ? 'kích hoạt' : 'tắt'}`,
        })
        fetchBanners()
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật banner',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const res = await fetch(`/api/banners/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã xóa banner' })
        fetchBanners()
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa banner',
        variant: 'destructive',
      })
    } finally {
      setDeleteId(null)
    }
  }

  const isActive = (banner: Banner) => {
    if (!banner.isActive) return false
    const now = new Date()
    if (banner.startDate && new Date(banner.startDate) > now) return false
    if (banner.endDate && new Date(banner.endDate) < now) return false
    return true
  }

  // Stats
  const totalViews = banners.reduce((sum, b) => sum + (b.viewCount || 0), 0)
  const totalClicks = banners.reduce((sum, b) => sum + (b.clickCount || 0), 0)
  const activeBanners = banners.filter(isActive).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Banner</h1>
          <p className="text-muted-foreground">
            Tạo và quản lý các banner thông báo, livestream cho web và app
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/banners/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo Banner
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Banner</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{banners.length}</div>
            <p className="text-xs text-muted-foreground">{activeBanners} đang hoạt động</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lượt xem</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lượt click</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CTR</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Banner</CardTitle>
          <CardDescription>Quản lý tất cả banner thông báo</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : banners.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-center">
              <Info className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Chưa có banner nào</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/dashboard/banners/new')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tạo banner đầu tiên
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Banner</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Vị trí</TableHead>
                  <TableHead>Hiển thị</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Thống kê</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((banner) => {
                  const Icon = TYPE_ICONS[banner.type as BannerType] || Info
                  const active = isActive(banner)

                  return (
                    <TableRow key={banner.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-lg"
                            style={{
                              backgroundColor: banner.backgroundColor || '#3b82f6',
                              color: banner.textColor || '#fff',
                            }}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium">{banner.title}</div>
                            {banner.content && (
                              <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                                {banner.content}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={TYPE_COLORS[banner.type as BannerType]}>
                          {BANNER_TYPE_LABELS[banner.type as BannerType]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {BANNER_POSITION_LABELS[banner.position as 'TOP' | 'BOTTOM' | 'MODAL']}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {active ? (
                            <Badge variant="default" className="bg-green-500">
                              <Eye className="mr-1 h-3 w-3" />
                              Đang hiển thị
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <EyeOff className="mr-1 h-3 w-3" />
                              Ẩn
                            </Badge>
                          )}
                          <div className="flex gap-1">
                            {banner.showOnMobile && (
                              <Smartphone className="h-4 w-4 text-muted-foreground" title="Mobile" />
                            )}
                            {banner.appVisible && (
                              <Monitor className="h-4 w-4 text-muted-foreground" title="App" />
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {banner.startDate && (
                            <div>
                              Từ:{' '}
                              {format(new Date(banner.startDate), 'dd/MM/yyyy HH:mm', {
                                locale: vi,
                              })}
                            </div>
                          )}
                          {banner.endDate && (
                            <div>
                              Đến:{' '}
                              {format(new Date(banner.endDate), 'dd/MM/yyyy HH:mm', {
                                locale: vi,
                              })}
                            </div>
                          )}
                          {!banner.startDate && !banner.endDate && (
                            <span className="text-muted-foreground">Không giới hạn</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {banner.viewCount?.toLocaleString() || 0}
                          </div>
                          <div className="flex items-center gap-1">
                            <MousePointer className="h-3 w-3" />{' '}
                            {banner.clickCount?.toLocaleString() || 0}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(banner)}
                            title={banner.isActive ? 'Tắt' : 'Bật'}
                          >
                            {banner.isActive ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/dashboard/banners/${banner.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => setDeleteId(banner.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa banner?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa banner này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

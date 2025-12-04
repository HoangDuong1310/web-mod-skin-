'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Eye, Smartphone, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  BannerFormData,
  BannerType,
  BannerPosition,
  BannerAudience,
  BANNER_TYPE_LABELS,
  BANNER_POSITION_LABELS,
  BANNER_AUDIENCE_LABELS,
  BANNER_STYLES,
} from '@/types/banner'

const defaultFormData: BannerFormData = {
  title: '',
  content: '',
  linkUrl: '',
  linkText: '',
  imageUrl: '',
  backgroundColor: '',
  textColor: '',
  type: 'INFO',
  position: 'TOP',
  isActive: true,
  isDismissible: true,
  showOnMobile: true,
  startDate: '',
  endDate: '',
  priority: 0,
  targetAudience: 'ALL',
  appVisible: true,
  appData: '',
}

export default function NewBannerPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<BannerFormData>(defaultFormData)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        linkUrl: formData.linkUrl || null,
        linkText: formData.linkText || null,
        imageUrl: formData.imageUrl || null,
        backgroundColor: formData.backgroundColor || null,
        textColor: formData.textColor || null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        appData: formData.appData || null,
      }

      const res = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã tạo banner mới' })
        router.push('/dashboard/banners')
      } else {
        const data = await res.json()
        toast({
          title: 'Lỗi',
          description: data.error || 'Không thể tạo banner',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi khi tạo banner',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const style = BANNER_STYLES[formData.type as BannerType]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Tạo Banner Mới</h1>
          <p className="text-muted-foreground">
            Tạo thông báo hiển thị trên web và app
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cơ bản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Tiêu đề *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="VD: 🔴 Đang Livestream! Tham gia ngay..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Nội dung</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Mô tả chi tiết về thông báo..."
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="linkUrl">Link URL</Label>
                    <Input
                      id="linkUrl"
                      type="url"
                      value={formData.linkUrl}
                      onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                      placeholder="https://youtube.com/live/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkText">Text nút</Label>
                    <Input
                      id="linkText"
                      value={formData.linkText}
                      onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                      placeholder="Xem ngay"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Hình ảnh URL</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hiển thị & Loại</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Loại banner</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, type: value as BannerType })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(BANNER_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Vị trí</Label>
                    <Select
                      value={formData.position}
                      onValueChange={(value) =>
                        setFormData({ ...formData, position: value as BannerPosition })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(BANNER_POSITION_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Đối tượng</Label>
                    <Select
                      value={formData.targetAudience}
                      onValueChange={(value) =>
                        setFormData({ ...formData, targetAudience: value as BannerAudience })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(BANNER_AUDIENCE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="backgroundColor">Màu nền</Label>
                    <div className="flex gap-2">
                      <Input
                        id="backgroundColor"
                        type="color"
                        value={formData.backgroundColor || style.bg.replace('bg-', '#')}
                        onChange={(e) =>
                          setFormData({ ...formData, backgroundColor: e.target.value })
                        }
                        className="h-10 w-14 p-1"
                      />
                      <Input
                        value={formData.backgroundColor}
                        onChange={(e) =>
                          setFormData({ ...formData, backgroundColor: e.target.value })
                        }
                        placeholder="#3b82f6"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="textColor">Màu chữ</Label>
                    <div className="flex gap-2">
                      <Input
                        id="textColor"
                        type="color"
                        value={formData.textColor || '#ffffff'}
                        onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                        className="h-10 w-14 p-1"
                      />
                      <Input
                        value={formData.textColor}
                        onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                        placeholder="#ffffff"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Độ ưu tiên</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Số lớn hơn sẽ hiển thị trước
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lịch trình</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Bắt đầu</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Kết thúc</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Để trống nếu muốn banner hiển thị ngay và không giới hạn thời gian
                </p>
              </CardContent>
            </Card>

            {/* App Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt cho App</CardTitle>
                <CardDescription>
                  Cấu hình dữ liệu bổ sung cho ứng dụng di động
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="appData">App Data (JSON)</Label>
                  <Textarea
                    id="appData"
                    value={formData.appData}
                    onChange={(e) => setFormData({ ...formData, appData: e.target.value })}
                    placeholder={`{
  "deepLink": "myapp://livestream",
  "showAsNotification": true,
  "notificationTitle": "🔴 Livestream đang diễn ra!",
  "notificationBody": "Nhấn để tham gia ngay"
}`}
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Dữ liệu JSON cho app sử dụng (deep link, notification, v.v.)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Xem trước
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="rounded-lg p-4 overflow-hidden"
                  style={{
                    backgroundColor: formData.backgroundColor || style.bg.includes('blue') ? '#3b82f6' : 
                      style.bg.includes('red') ? '#ef4444' :
                      style.bg.includes('purple') ? '#a855f7' :
                      style.bg.includes('yellow') ? '#eab308' :
                      style.bg.includes('green') ? '#22c55e' :
                      style.bg.includes('orange') ? '#f97316' : '#3b82f6',
                    color: formData.textColor || '#ffffff',
                  }}
                >
                  {/* Image Preview */}
                  {formData.imageUrl && (
                    <div className="mb-3 -mx-4 -mt-4">
                      <img
                        src={formData.imageUrl}
                        alt="Banner preview"
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {formData.type === 'LIVESTREAM' && (
                      <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-white"></span>
                      </span>
                    )}
                    <p className="font-medium">{formData.title || 'Tiêu đề banner'}</p>
                  </div>
                  {formData.content && (
                    <p className="mt-1 text-sm opacity-90">{formData.content}</p>
                  )}
                  {formData.linkUrl && (
                    <button className="mt-2 rounded bg-white/20 px-3 py-1 text-sm hover:bg-white/30">
                      {formData.linkText || 'Xem ngay'} →
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Kích hoạt</Label>
                    <p className="text-xs text-muted-foreground">Hiển thị banner ngay</p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cho phép đóng</Label>
                    <p className="text-xs text-muted-foreground">Người dùng có thể tắt</p>
                  </div>
                  <Switch
                    checked={formData.isDismissible}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isDismissible: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      <Label>Mobile Web</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">Hiển thị trên mobile</p>
                  </div>
                  <Switch
                    checked={formData.showOnMobile}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, showOnMobile: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <Label>App</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">Hiển thị trên app</p>
                  </div>
                  <Switch
                    checked={formData.appVisible}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, appVisible: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
              >
                Hủy
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Tạo Banner
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

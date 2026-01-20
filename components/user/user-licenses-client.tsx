'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Key,
  Copy,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Ban,
  Laptop,
  Calendar,
  Loader2,
  ShoppingCart,
  Eye,
  EyeOff,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { vi } from 'date-fns/locale'
import Link from 'next/link'

interface License {
  id: string
  key: string
  status: string
  activatedAt: string | null
  expiresAt: string | null
  maxDevices: number
  currentDevices: number
  daysRemaining: number | null
  activeDevicesCount: number
  createdAt: string
  plan: {
    id: string
    name: string
    durationType: string
    durationValue: number
    maxDevices: number
  }
  activations: {
    id: string
    deviceName: string | null
    activatedAt: string
    lastSeenAt: string
  }[]
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary'; icon: any; color: string }> = {
  INACTIVE: { label: 'Chưa kích hoạt', variant: 'secondary', icon: Clock, color: 'text-gray-500' },
  ACTIVE: { label: 'Đang hoạt động', variant: 'success', icon: CheckCircle, color: 'text-green-500' },
  EXPIRED: { label: 'Hết hạn', variant: 'warning', icon: AlertCircle, color: 'text-yellow-500' },
  SUSPENDED: { label: 'Tạm khóa', variant: 'warning', icon: AlertCircle, color: 'text-yellow-500' },
  REVOKED: { label: 'Thu hồi', variant: 'destructive', icon: XCircle, color: 'text-red-500' },
  BANNED: { label: 'Bị cấm', variant: 'destructive', icon: Ban, color: 'text-red-500' },
}

export function UserLicensesClient() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})

  const fetchLicenses = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/user/licenses')
      const data = await res.json()
      
      if (data.success) {
        setLicenses(data.data)
      }
    } catch (error) {
      toast.error('Không thể tải danh sách licenses')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLicenses()
  }, [fetchLicenses])

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key)
    toast.success('Đã copy license key')
  }

  const toggleShowKey = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const maskKey = (key: string) => {
    const parts = key.split('-')
    return parts.map((part, i) => i === 0 ? part : '****').join('-')
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    // Parse as UTC to match server timezone
    const utcDate = new Date(date + 'Z')
    return format(utcDate, 'dd/MM/yyyy HH:mm', { locale: vi })
  }

  // Format relative time for last seen
  const formatLastSeen = (date: string) => {
    const utcDate = new Date(date + 'Z')
    return formatDistanceToNow(utcDate, { addSuffix: true, locale: vi })
  }

  const formatDuration = (type: string, value: number) => {
    const labels: Record<string, string> = {
      DAY: 'ngày',
      WEEK: 'tuần',
      MONTH: 'tháng',
      QUARTER: 'quý',
      YEAR: 'năm',
      LIFETIME: 'Vĩnh viễn',
    }
    if (type === 'LIFETIME') return 'Vĩnh viễn'
    return `${value} ${labels[type]}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (licenses.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Chưa có license nào</h3>
          <p className="text-muted-foreground mb-4">
            Bạn chưa có license key nào. Hãy mua gói cước để bắt đầu sử dụng!
          </p>
          <Button asChild>
            <Link href="/pricing">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Xem bảng giá
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {licenses.map((license) => {
        const status = statusConfig[license.status] || statusConfig.INACTIVE
        const StatusIcon = status.icon
        const isShowingKey = showKeys[license.id]
        
        return (
          <Card key={license.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    {license.plan.name}
                  </CardTitle>
                  <CardDescription>
                    {formatDuration(license.plan.durationType, license.plan.durationValue)}
                  </CardDescription>
                </div>
                <Badge variant={status.variant as any}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* License Key */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <code className="flex-1 font-mono text-sm">
                  {isShowingKey ? license.key : maskKey(license.key)}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleShowKey(license.id)}
                >
                  {isShowingKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyKey(license.key)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Laptop className={`h-4 w-4 ${status.color}`} />
                  <span>
                    {license.activeDevicesCount}/{license.maxDevices} thiết bị
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {license.activatedAt ? 'Kích hoạt: ' + formatDate(license.activatedAt) : 'Chưa kích hoạt'}
                  </span>
                </div>
                
                {license.expiresAt && (
                  <div className="flex items-center gap-2">
                    <Clock className={`h-4 w-4 ${license.daysRemaining && license.daysRemaining <= 7 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                    <span>
                      {license.daysRemaining !== null 
                        ? license.daysRemaining > 0 
                          ? `Còn ${license.daysRemaining} ngày`
                          : 'Đã hết hạn'
                        : 'Vĩnh viễn'
                      }
                    </span>
                  </div>
                )}
              </div>
              
              {/* Devices */}
              {license.activations.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Thiết bị đã kích hoạt:</p>
                  <div className="space-y-2">
                    {license.activations.map((activation) => (
                      <div 
                        key={activation.id}
                        className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <Laptop className="h-4 w-4" />
                          <span>{activation.deviceName || 'Thiết bị không tên'}</span>
                        </div>
                        <span className="text-muted-foreground text-xs">
                          Online {formatLastSeen(activation.lastSeenAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedLicense(license)
                    setDetailOpen(true)
                  }}
                >
                  Xem chi tiết
                </Button>
                {license.status === 'EXPIRED' && (
                  <Button size="sm" asChild>
                    <Link href="/pricing">Gia hạn</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết License</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về license key của bạn
            </DialogDescription>
          </DialogHeader>
          
          {selectedLicense && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">License Key</label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <code className="flex-1 font-mono text-sm break-all">
                    {selectedLicense.key}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyKey(selectedLicense.key)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Gói cước</label>
                  <p className="font-medium">{selectedLicense.plan.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Trạng thái</label>
                  <p>
                    <Badge variant={statusConfig[selectedLicense.status]?.variant as any}>
                      {statusConfig[selectedLicense.status]?.label}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ngày kích hoạt</label>
                  <p>{formatDate(selectedLicense.activatedAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ngày hết hạn</label>
                  <p>{selectedLicense.expiresAt ? formatDate(selectedLicense.expiresAt) : 'Vĩnh viễn'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Thiết bị</label>
                  <p>{selectedLicense.activeDevicesCount}/{selectedLicense.maxDevices}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ngày còn lại</label>
                  <p>
                    {selectedLicense.daysRemaining !== null 
                      ? selectedLicense.daysRemaining > 0 
                        ? `${selectedLicense.daysRemaining} ngày`
                        : 'Đã hết hạn'
                      : 'Vĩnh viễn'
                    }
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Nếu cần hỗ trợ về license, vui lòng liên hệ qua trang{' '}
                  <Link href="/contact" className="text-primary hover:underline">
                    Contact
                  </Link>
                  .
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { formatDateVN } from '@/lib/utils'
import { 
  ArrowLeft, 
  ShoppingCart, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Key,
  Loader2,
  ExternalLink
} from 'lucide-react'

interface Order {
  id: string
  orderCode: string
  totalAmount: number
  currency: string
  status: string
  paymentStatus: string
  paymentMethod: string
  createdAt: string
  paidAt: string | null
  plan: {
    id: string
    name: string
    slug: string
    durationType: string
    durationValue: number
  }
  licenseKey: {
    id: string
    key: string
    status: string
    expiresAt: string | null
  } | null
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: XCircle },
}

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-800' },
  COMPLETED: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800' },
  FAILED: { label: 'Thất bại', color: 'bg-red-100 text-red-800' },
  REFUNDED: { label: 'Đã hoàn tiền', color: 'bg-gray-100 text-gray-800' },
}

export function UserOrdersClient() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      const data = await response.json()

      if (response.ok) {
        setOrders(data.orders)
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải lịch sử đơn hàng',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Đã copy',
      description: 'Đã copy vào clipboard',
    })
  }

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return formatDateVN(date)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link 
          href="/profile" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại Profile
        </Link>
        <h1 className="text-2xl font-bold">Lịch sử đơn hàng</h1>
        <p className="text-muted-foreground">
          Xem tất cả đơn hàng và license keys của bạn
        </p>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-2">Chưa có đơn hàng nào</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Mua gói cước để bắt đầu sử dụng
            </p>
            <Button asChild>
              <Link href="/pricing">Xem bảng giá</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.PENDING
            const paymentStatus = paymentStatusConfig[order.paymentStatus] || paymentStatusConfig.PENDING
            const StatusIcon = status.icon

            return (
              <Card key={order.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {order.orderCode}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(order.orderCode)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </CardTitle>
                      <CardDescription>
                        {formatDate(order.createdAt)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={status.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                      <Badge className={paymentStatus.color}>
                        {paymentStatus.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Order Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Gói cước</p>
                      <p className="font-medium">{order.plan.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Số tiền</p>
                      <p className="font-bold text-primary">
                        {formatPrice(order.totalAmount, order.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phương thức</p>
                      <p className="font-medium">{order.paymentMethod}</p>
                    </div>
                    {order.paidAt && (
                      <div>
                        <p className="text-muted-foreground">Ngày thanh toán</p>
                        <p className="font-medium">{formatDate(order.paidAt)}</p>
                      </div>
                    )}
                  </div>

                  {/* License Key */}
                  {order.licenseKey && order.paymentStatus === 'COMPLETED' && (
                    <>
                      <Separator />
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Key className="h-4 w-4 text-primary" />
                          <span className="font-medium">License Key</span>
                          <Badge variant="outline" className="ml-auto">
                            {order.licenseKey.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 font-mono text-sm bg-background px-3 py-2 rounded border">
                            {order.licenseKey.key}
                          </code>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => copyToClipboard(order.licenseKey!.key)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                        </div>
                        {order.licenseKey.expiresAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Hết hạn: {formatDate(order.licenseKey.expiresAt)}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Pending Payment */}
                  {order.paymentStatus === 'PENDING' && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                        <div>
                          <p className="font-medium text-yellow-800 dark:text-yellow-200">
                            Đang chờ thanh toán
                          </p>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            Vui lòng hoàn tất thanh toán trong 30 phút
                          </p>
                        </div>
                        <Button asChild variant="default" size="sm">
                          <Link href={`/checkout/${order.plan.slug}`}>
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Thanh toán
                          </Link>
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Quick Links */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" asChild>
              <Link href="/profile/licenses">
                <Key className="h-4 w-4 mr-2" />
                Quản lý Licenses
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pricing">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Mua thêm gói
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

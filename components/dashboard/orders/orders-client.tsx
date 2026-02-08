'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Loader2,
  Copy,
  Key,
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
  user: {
    id: string
    name: string | null
    email: string
  }
  plan: {
    id: string
    name: string
    slug: string
    durationType: string
  }
  licenseKey: {
    id: string
    key: string
    status: string
  } | null
}

interface Stats {
  totalRevenue: number
  pendingCount: number
  completedCount: number
  todayOrders: number
}

export function OrdersClient() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Confirm payment dialog
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  const fetchOrders = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      })
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (paymentFilter !== 'all') params.set('paymentStatus', paymentFilter)

      const response = await fetch(`/api/admin/orders?${params}`)
      const data = await response.json()

      if (response.ok) {
        setOrders(data.orders)
        setStats(data.stats)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách đơn hàng',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [page, statusFilter, paymentFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchOrders()
  }

  const confirmPayment = async () => {
    if (!selectedOrder) return
    setIsConfirming(true)

    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus: 'COMPLETED',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Thành công',
          description: 'Đã xác nhận thanh toán và kích hoạt license',
        })
        setShowConfirmDialog(false)
        fetchOrders()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể xác nhận thanh toán',
        variant: 'destructive',
      })
    } finally {
      setIsConfirming(false)
    }
  }

  const cancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CANCELLED',
          paymentStatus: 'CANCELLED',
        }),
      })

      if (response.ok) {
        toast({
          title: 'Đã hủy đơn hàng',
        })
        fetchOrders()
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể hủy đơn hàng',
        variant: 'destructive',
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Đã copy!',
    })
  }

  const formatPrice = (amount: number, currency: string = 'VND') => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('vi-VN')
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      PENDING: { variant: 'secondary', label: 'Chờ xử lý' },
      PROCESSING: { variant: 'default', label: 'Đang xử lý' },
      COMPLETED: { variant: 'default', label: 'Hoàn thành' },
      CANCELLED: { variant: 'destructive', label: 'Đã hủy' },
      REFUNDED: { variant: 'outline', label: 'Hoàn tiền' },
    }
    const { variant, label } = variants[status] || { variant: 'secondary', label: status }
    return <Badge variant={variant}>{label}</Badge>
  }

  const getPaymentBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      PENDING: { variant: 'secondary', label: 'Chờ thanh toán', icon: Clock },
      COMPLETED: { variant: 'default', label: 'Đã thanh toán', icon: CheckCircle },
      FAILED: { variant: 'destructive', label: 'Thất bại', icon: XCircle },
      CANCELLED: { variant: 'outline', label: 'Đã hủy', icon: XCircle },
      REFUNDED: { variant: 'outline', label: 'Hoàn tiền', icon: DollarSign },
    }
    const { variant, label, icon: Icon } = variants[status] || { 
      variant: 'secondary', 
      label: status, 
      icon: Clock 
    }
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  // Tra cứu order từ message
  const [lookupCode, setLookupCode] = useState('')
  const [lookupResult, setLookupResult] = useState<any>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const lookupInputRef = useRef<HTMLInputElement>(null)

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLookupLoading(true)
    setLookupError('')
    setLookupResult(null)
    try {
      const res = await fetch(`/api/admin/orders/find-user-by-order-message?message=${encodeURIComponent(lookupCode)}`)
      const data = await res.json()
      if (res.ok) {
        setLookupResult(data.order)
      } else {
        setLookupError(data.error || 'Không tìm thấy đơn hàng')
      }
    } catch (err) {
      setLookupError('Lỗi server')
    } finally {
      setLookupLoading(false)
    }
  }

  // Nút focus vào ô tra cứu
  const focusLookupInput = () => {
    lookupInputRef.current?.focus()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý đơn hàng</h1>
        <p className="text-muted-foreground">
          Xem và xử lý các đơn hàng mua license
        </p>
      </div>

      {/* Nút tra cứu nổi bật */}
      <div className="flex items-center gap-2 mb-2">
        <Button variant="default" onClick={focusLookupInput}>
          Tra cứu đơn hàng
        </Button>
        <span className="text-muted-foreground text-xs">(Tìm nhanh đơn hàng từ mã Ko-fi/message)</span>
      </div>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Tra cứu user từ mã order (message Ko-fi)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-2 items-end">
            <Input
              ref={lookupInputRef}
              placeholder="Nhập mã order từ message, ví dụ ORD..."
              value={lookupCode}
              onChange={e => setLookupCode(e.target.value)}
              className="max-w-xs"
              required
            />
            <Button type="submit" disabled={lookupLoading}>
              {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tra cứu'}
            </Button>
          </form>
          {lookupError && <p className="text-destructive mt-2">{lookupError}</p>}
          {lookupResult && (
            <div className="mt-4 p-3 border rounded bg-muted">
              <div className="mb-2 font-medium">Thông tin đơn hàng:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Mã đơn:</span> <span className="font-mono">{lookupResult.orderCode || lookupResult.orderNumber}</span></div>
                <div><span className="text-muted-foreground">Trạng thái:</span> {lookupResult.status}</div>
                <div><span className="text-muted-foreground">Khách hàng:</span> {lookupResult.user?.name || 'N/A'} ({lookupResult.user?.email})</div>
                <div><span className="text-muted-foreground">Gói:</span> {lookupResult.plan?.name}</div>
                <div><span className="text-muted-foreground">Ngày tạo:</span> {formatDate(lookupResult.createdAt)}</div>
                <div><span className="text-muted-foreground">Thanh toán:</span> {lookupResult.paymentStatus}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatPrice(stats.totalRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Đơn chờ xử lý</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pendingCount}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Đơn hoàn thành</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Đơn hôm nay</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.todayOrders}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách đơn hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <Input
                placeholder="Tìm theo mã đơn, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
              <Button type="submit" variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Thanh toán" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="PENDING">Chờ thanh toán</SelectItem>
                <SelectItem value="COMPLETED">Đã thanh toán</SelectItem>
                <SelectItem value="FAILED">Thất bại</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchOrders}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có đơn hàng nào</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đơn</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Gói</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Thanh toán</TableHead>
                      <TableHead>License</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
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
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.user.name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.user.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.plan.name}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatPrice(order.totalAmount, order.currency)}
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{getPaymentBadge(order.paymentStatus)}</TableCell>
                        <TableCell>
                          {order.licenseKey ? (
                            <div className="flex items-center gap-2">
                              <Key className="h-3 w-3 text-muted-foreground" />
                              <code className="text-xs">
                                {order.licenseKey.key.substring(0, 9)}...
                              </code>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {order.paymentStatus === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedOrder(order)
                                    setShowConfirmDialog(true)
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Xác nhận
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => cancelOrder(order.id)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Trước
                  </Button>
                  <span className="flex items-center px-4 text-sm">
                    Trang {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Sau
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirm Payment Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận thanh toán</DialogTitle>
            <DialogDescription>
              Xác nhận đã nhận được thanh toán cho đơn hàng này?
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Mã đơn</p>
                  <p className="font-mono font-medium">{selectedOrder.orderCode}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Số tiền</p>
                  <p className="font-medium text-green-600">
                    {formatPrice(selectedOrder.totalAmount, selectedOrder.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Khách hàng</p>
                  <p className="font-medium">{selectedOrder.user.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gói mua</p>
                  <p className="font-medium">{selectedOrder.plan.name}</p>
                </div>
              </div>

              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-medium mb-1">Lưu ý:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>License key sẽ được kích hoạt ngay sau khi xác nhận</li>
                  <li>Hành động này không thể hoàn tác</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isConfirming}
            >
              Hủy
            </Button>
            <Button onClick={confirmPayment} disabled={isConfirming}>
              {isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Xác nhận thanh toán
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
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
import { Label } from '@/components/ui/label'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  Key,
  Loader2,
  Shield,
  ShieldOff,
  Plus,
  Settings,
  Eye,
  Ban,
  Copy,
  TrendingUp,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Reseller {
  id: string
  businessName: string | null
  contactEmail: string | null
  contactPhone: string | null
  website: string | null
  status: string
  balance: number
  totalSpent: number
  discountPercent: number
  freeKeyQuotaDaily: number
  freeKeyQuotaMonthly: number
  maxKeysPerOrder: number
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
  freeKeyPlan: {
    id: string
    name: string
  } | null
  _count?: {
    apiKeys: number
    transactions: number
    keyAllocations: number
  }
}

interface Stats {
  total: number
  pending: number
  approved: number
  suspended: number
  rejected: number
  totalBalance: number
  totalSpent: number
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    PENDING: { label: 'Chờ duyệt', variant: 'outline' },
    APPROVED: { label: 'Đã duyệt', variant: 'default' },
    SUSPENDED: { label: 'Tạm ngưng', variant: 'secondary' },
    REJECTED: { label: 'Từ chối', variant: 'destructive' },
    BANNED: { label: 'Cấm', variant: 'destructive' },
  }
  const info = map[status] || { label: status, variant: 'outline' as const }
  return <Badge variant={info.variant}>{info.label}</Badge>
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ResellersClient() {
  const { toast } = useToast()

  // State
  const [resellers, setResellers] = useState<Reseller[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Dialog states
  const [actionLoading, setActionLoading] = useState(false)
  const [showCreditDialog, setShowCreditDialog] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null)
  const [creditAmount, setCreditAmount] = useState('')
  const [creditNote, setCreditNote] = useState('')

  // Config form
  const [configForm, setConfigForm] = useState({
    discountPercent: 0,
    freeKeyQuotaDaily: 0,
    freeKeyQuotaMonthly: 0,
    maxKeysPerOrder: 100,
    freeKeyPlanId: '',
  })

  // Plans for config dialog
  const [availablePlans, setAvailablePlans] = useState<{ id: string; name: string; durationType: string; durationValue: number }[]>([])

  // Detail state
  const [resellerDetail, setResellerDetail] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchResellers = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await fetch(`/api/admin/resellers?${params}`)
      const data = await res.json()

      if (res.ok) {
        setResellers(data.resellers)
        setStats(data.stats)
        setTotalPages(data.pagination.totalPages)
      }
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách reseller', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchResellers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchResellers()
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  const performAction = async (action: string, resellerId: string, extra?: Record<string, any>) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/resellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, resellerId, ...extra }),
      })
      const data = await res.json()

      if (res.ok) {
        toast({ title: 'Thành công', description: data.message || 'Thao tác thành công' })
        fetchResellers()
        return data
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message || 'Thao tác thất bại', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprove = async (r: Reseller) => {
    const data = await performAction('approve', r.id)
    if (data?.apiKey) {
      navigator.clipboard.writeText(data.apiKey)
      toast({ title: 'Đã duyệt & tạo API Key', description: `API Key đã copy vào clipboard: ${data.apiKey.substring(0, 16)}...` })
    }
  }
  const handleReject = (r: Reseller) => performAction('reject', r.id)
  const handleSuspend = (r: Reseller) => performAction('suspend', r.id)
  const handleUnsuspend = (r: Reseller) => performAction('unsuspend', r.id)

  const handleAddCredit = async () => {
    if (!selectedReseller || !creditAmount) return
    const amount = parseFloat(creditAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Lỗi', description: 'Số tiền không hợp lệ', variant: 'destructive' })
      return
    }
    await performAction('add_credit', selectedReseller.id, { amount, description: creditNote })
    setShowCreditDialog(false)
    setCreditAmount('')
    setCreditNote('')
  }

  const handleUpdateConfig = async () => {
    if (!selectedReseller) return
    await performAction('update_config', selectedReseller.id, configForm)
    setShowConfigDialog(false)
  }

  const handleGenerateApiKey = async (r: Reseller) => {
    const data = await performAction('generate_api_key', r.id)
    if (data?.apiKey) {
      navigator.clipboard.writeText(data.apiKey)
      toast({ title: 'API Key đã tạo', description: 'Đã copy vào clipboard. Key chỉ hiện 1 lần!' })
    }
  }

  const openCreditDialog = (r: Reseller) => {
    setSelectedReseller(r)
    setCreditAmount('')
    setCreditNote('')
    setShowCreditDialog(true)
  }

  const openConfigDialog = async (r: Reseller) => {
    setSelectedReseller(r)
    setConfigForm({
      discountPercent: r.discountPercent,
      freeKeyQuotaDaily: r.freeKeyQuotaDaily,
      freeKeyQuotaMonthly: r.freeKeyQuotaMonthly,
      maxKeysPerOrder: r.maxKeysPerOrder,
      freeKeyPlanId: r.freeKeyPlan?.id || '',
    })
    setShowConfigDialog(true)
    // Fetch available plans for selector
    if (availablePlans.length === 0) {
      try {
        const res = await fetch('/api/admin/resellers?getPlans=true')
        const data = await res.json()
        if (data.plans) setAvailablePlans(data.plans)
      } catch {}
    }
  }

  const openDetailDialog = async (r: Reseller) => {
    setSelectedReseller(r)
    setShowDetailDialog(true)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/resellers/${r.id}`)
      const data = await res.json()
      if (res.ok) {
        setResellerDetail(data.reseller)
      }
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể tải chi tiết', variant: 'destructive' })
    } finally {
      setDetailLoading(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng Reseller</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.approved} đã duyệt, {stats.pending} chờ duyệt
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Yêu cầu mới</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng số dư</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalBalance)}</div>
              <p className="text-xs text-muted-foreground">Trong hệ thống</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng chi tiêu</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{formatCurrency(stats.totalSpent)}</div>
              <p className="text-xs text-muted-foreground">Doanh thu từ reseller</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Reseller</CardTitle>
          <CardDescription>Quản lý đại lý và cấu hình</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên, email, công ty..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                <SelectItem value="SUSPENDED">Tạm ngưng</SelectItem>
                <SelectItem value="REJECTED">Từ chối</SelectItem>
                <SelectItem value="BANNED">Cấm</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => fetchResellers()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : resellers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Không có reseller nào
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reseller</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Số dư</TableHead>
                      <TableHead className="text-right">Đã chi</TableHead>
                      <TableHead className="text-center">Chiết khấu</TableHead>
                      <TableHead className="text-center">Keys</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resellers.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{r.user.name || r.user.email}</p>
                            <p className="text-xs text-muted-foreground">{r.user.email}</p>
                            {r.businessName && (
                              <p className="text-xs text-muted-foreground">{r.businessName}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{statusBadge(r.status)}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(r.balance)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(r.totalSpent)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{r.discountPercent}%</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {r._count?.keyAllocations || 0}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(r.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            <Button size="sm" variant="ghost" onClick={() => openDetailDialog(r)} title="Xem chi tiết">
                              <Eye className="h-4 w-4" />
                            </Button>

                            {r.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-600"
                                  onClick={() => handleApprove(r)}
                                  disabled={actionLoading}
                                  title="Duyệt"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600"
                                  onClick={() => handleReject(r)}
                                  disabled={actionLoading}
                                  title="Từ chối"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}

                            {r.status === 'APPROVED' && (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => openCreditDialog(r)} title="Nạp tiền">
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => openConfigDialog(r)} title="Cấu hình">
                                  <Settings className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleGenerateApiKey(r)} disabled={actionLoading} title="Tạo API Key">
                                  <Key className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-orange-600" onClick={() => handleSuspend(r)} disabled={actionLoading} title="Tạm ngưng">
                                  <ShieldOff className="h-4 w-4" />
                                </Button>
                              </>
                            )}

                            {r.status === 'SUSPENDED' && (
                              <Button size="sm" variant="ghost" className="text-green-600" onClick={() => handleUnsuspend(r)} disabled={actionLoading} title="Kích hoạt lại">
                                <Shield className="h-4 w-4" />
                              </Button>
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
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    Trước
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Trang {page} / {totalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    Sau
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ─── Add Credit Dialog ──────────────────────────────────────────────── */}
      <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nạp tiền cho Reseller</DialogTitle>
            <DialogDescription>
              Nạp tiền vào tài khoản của {selectedReseller?.user.name || selectedReseller?.user.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Số tiền (VND)</Label>
              <Input
                type="number"
                min="0"
                placeholder="100000"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>Ghi chú</Label>
              <Input
                placeholder="Nạp tiền qua chuyển khoản..."
                value={creditNote}
                onChange={(e) => setCreditNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreditDialog(false)}>Hủy</Button>
            <Button onClick={handleAddCredit} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Nạp tiền
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Config Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cấu hình Reseller</DialogTitle>
            <DialogDescription>
              Cập nhật cấu hình cho {selectedReseller?.user.name || selectedReseller?.user.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Chiết khấu (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={configForm.discountPercent}
                  onChange={(e) => setConfigForm({ ...configForm, discountPercent: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Max keys/đơn</Label>
                <Input
                  type="number"
                  min="1"
                  value={configForm.maxKeysPerOrder}
                  onChange={(e) => setConfigForm({ ...configForm, maxKeysPerOrder: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quota free key/ngày</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0 = không giới hạn"
                  value={configForm.freeKeyQuotaDaily}
                  onChange={(e) => setConfigForm({ ...configForm, freeKeyQuotaDaily: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground mt-1">0 = không giới hạn</p>
              </div>
              <div>
                <Label>Quota free key/tháng</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0 = không giới hạn"
                  value={configForm.freeKeyQuotaMonthly}
                  onChange={(e) => setConfigForm({ ...configForm, freeKeyQuotaMonthly: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground mt-1">0 = không giới hạn</p>
              </div>
            </div>
            <div>
              <Label>Free Key Plan</Label>
              <Select
                value={configForm.freeKeyPlanId || 'none'}
                onValueChange={(v) => setConfigForm({ ...configForm, freeKeyPlanId: v === 'none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn plan cho free key" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Chưa chọn —</SelectItem>
                  {availablePlans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.durationType} × {p.durationValue})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Plan này quyết định thời hạn và cấu hình của free key
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>Hủy</Button>
            <Button onClick={handleUpdateConfig} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Detail Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết Reseller</DialogTitle>
            <DialogDescription>
              {selectedReseller?.user.name || selectedReseller?.user.email}
              {selectedReseller?.businessName && ` – ${selectedReseller.businessName}`}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : resellerDetail ? (
            <Tabs defaultValue="info">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Thông tin</TabsTrigger>
                <TabsTrigger value="transactions">Giao dịch</TabsTrigger>
                <TabsTrigger value="keys">Keys</TabsTrigger>
              </TabsList>

              {/* Info Tab */}
              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{resellerDetail.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Trạng thái</p>
                    {statusBadge(resellerDetail.status)}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Số dư</p>
                    <p className="font-medium font-mono">{formatCurrency(resellerDetail.balance)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Đã chi</p>
                    <p className="font-medium font-mono">{formatCurrency(resellerDetail.totalSpent)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Chiết khấu</p>
                    <p className="font-medium">{resellerDetail.discountPercent}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Max keys/đơn</p>
                    <p className="font-medium">{resellerDetail.maxKeysPerOrder}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Quota ngày</p>
                    <p className="font-medium">{resellerDetail.freeKeyQuotaDaily === 0 ? 'Không giới hạn' : resellerDetail.freeKeyQuotaDaily}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Quota tháng</p>
                    <p className="font-medium">{resellerDetail.freeKeyQuotaMonthly === 0 ? 'Không giới hạn' : resellerDetail.freeKeyQuotaMonthly}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Free Key Plan</p>
                    <p className="font-medium">{resellerDetail.freeKeyPlan?.name || 'Chưa thiết lập'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Website</p>
                    <p className="font-medium">{resellerDetail.website || '—'}</p>
                  </div>
                </div>

                {/* API Keys */}
                {resellerDetail.apiKeys?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">API Keys</h4>
                    <div className="space-y-2">
                      {resellerDetail.apiKeys.map((ak: any) => (
                        <div key={ak.id} className="flex items-center justify-between text-sm border rounded p-2">
                          <div>
                            <span className="font-mono">{ak.apiKey?.substring(0, 16)}...</span>
                            <Badge variant={ak.isActive ? 'default' : 'secondary'} className="ml-2">
                              {ak.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 ml-1"
                              onClick={() => {
                                navigator.clipboard.writeText(ak.apiKey || '')
                                toast({ title: 'Đã copy API Key' })
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="text-muted-foreground text-xs">
                            {ak.lastUsedAt ? `Dùng: ${formatDate(ak.lastUsedAt)}` : 'Chưa sử dụng'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Transactions Tab */}
              <TabsContent value="transactions">
                {resellerDetail.transactions?.length > 0 ? (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Loại</TableHead>
                          <TableHead className="text-right">Số tiền</TableHead>
                          <TableHead className="text-right">Sau GD</TableHead>
                          <TableHead>Ghi chú</TableHead>
                          <TableHead>Thời gian</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resellerDetail.transactions.map((tx: any) => (
                          <TableRow key={tx.id}>
                            <TableCell>
                              <Badge variant="outline">{tx.type}</Badge>
                            </TableCell>
                            <TableCell className={`text-right font-mono ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(tx.balanceAfter)}
                            </TableCell>
                            <TableCell className="text-sm max-w-[200px] truncate">
                              {tx.description || '—'}
                            </TableCell>
                            <TableCell className="text-sm">{formatDate(tx.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">Chưa có giao dịch nào</p>
                )}
              </TabsContent>

              {/* Keys Tab */}
              <TabsContent value="keys">
                {resellerDetail.keyAllocations?.length > 0 ? (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Key</TableHead>
                          <TableHead>Loại</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead className="text-right">Giá</TableHead>
                          <TableHead>Ngày tạo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resellerDetail.keyAllocations.map((ka: any) => (
                          <TableRow key={ka.id}>
                            <TableCell className="font-mono text-xs">
                              {ka.licenseKey?.key?.substring(0, 20)}...
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 ml-1"
                                onClick={() => {
                                  navigator.clipboard.writeText(ka.licenseKey?.key || '')
                                  toast({ title: 'Đã copy key' })
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </TableCell>
                            <TableCell>
                              <Badge variant={ka.keyType === 'FREE' ? 'secondary' : 'default'}>
                                {ka.keyType === 'FREE' ? 'Free' : 'Mua'}
                              </Badge>
                            </TableCell>
                            <TableCell>{ka.licenseKey?.plan?.name || '—'}</TableCell>
                            <TableCell className="text-right font-mono">
                              {ka.purchasePrice ? formatCurrency(Number(ka.purchasePrice)) : 'Free'}
                            </TableCell>
                            <TableCell className="text-sm">{formatDate(ka.allocatedAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">Chưa có key nào</p>
                )}
              </TabsContent>
            </Tabs>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

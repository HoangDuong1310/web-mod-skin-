'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
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
import { Label } from '@/components/ui/label'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  Key,
  DollarSign,
  Package,
  Clock,
  Loader2,
  Copy,
  ShoppingCart,
  Zap,
  TrendingUp,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  User,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    PENDING: { label: 'Chờ duyệt', variant: 'outline' },
    APPROVED: { label: 'Hoạt động', variant: 'default' },
    SUSPENDED: { label: 'Tạm ngưng', variant: 'secondary' },
    REJECTED: { label: 'Từ chối', variant: 'destructive' },
  }
  const info = map[status] || { label: status, variant: 'outline' as const }
  return <Badge variant={info.variant}>{info.label}</Badge>
}

// ─── Registration Form ────────────────────────────────────────────────────────

function ResellerRegistration({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    businessName: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    description: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.businessName || !form.contactEmail) {
      toast({ title: 'Lỗi', description: 'Vui lòng điền tên doanh nghiệp và email liên hệ', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/reseller/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'Thành công!', description: 'Đăng ký reseller thành công. Vui lòng chờ admin duyệt.' })
        onSuccess()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message || 'Đăng ký thất bại', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Đăng ký Reseller</h1>
        <p className="text-muted-foreground mt-2">
          Trở thành đại lý bán key và nhận chiết khấu hấp dẫn
        </p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <h3 className="font-semibold">Chiết khấu cao</h3>
            <p className="text-sm text-muted-foreground">Giảm giá khi mua key số lượng lớn</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Zap className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
            <h3 className="font-semibold">Free Key API</h3>
            <p className="text-sm text-muted-foreground">Tạo key miễn phí qua API cho khách hàng</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Key className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <h3 className="font-semibold">API tự động</h3>
            <p className="text-sm text-muted-foreground">Tích hợp API vào hệ thống của bạn</p>
          </CardContent>
        </Card>
      </div>

      {/* Registration Form */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin đăng ký</CardTitle>
          <CardDescription>Điền thông tin để đăng ký làm đại lý</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Tên doanh nghiệp / cửa hàng *</Label>
              <Input
                placeholder="VD: Shop Game ABC"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Email liên hệ *</Label>
                <Input
                  type="email"
                  placeholder="contact@example.com"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Số điện thoại</Label>
                <Input
                  placeholder="0901234567"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Website / Fanpage</Label>
              <Input
                placeholder="https://..."
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </div>
            <div>
              <Label>Mô tả hoạt động</Label>
              <textarea
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Mô tả ngắn về hoạt động kinh doanh của bạn..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Gửi đăng ký
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Pending Status ───────────────────────────────────────────────────────────

function ResellerPending() {
  return (
    <div className="max-w-lg mx-auto text-center space-y-4 py-12">
      <Clock className="h-16 w-16 mx-auto text-orange-400" />
      <h2 className="text-2xl font-bold">Đang chờ duyệt</h2>
      <p className="text-muted-foreground">
        Yêu cầu đăng ký reseller của bạn đang được xem xét. 
        Admin sẽ duyệt và liên hệ với bạn sớm nhất.
      </p>
      <Badge variant="outline" className="text-lg px-4 py-2">
        <Clock className="h-4 w-4 mr-2" />
        PENDING
      </Badge>
    </div>
  )
}

// ─── Rejected Status ──────────────────────────────────────────────────────────

function ResellerRejected({ reason }: { reason?: string }) {
  return (
    <div className="max-w-lg mx-auto text-center space-y-4 py-12">
      <XCircle className="h-16 w-16 mx-auto text-red-400" />
      <h2 className="text-2xl font-bold">Yêu cầu bị từ chối</h2>
      <p className="text-muted-foreground">
        Yêu cầu đăng ký reseller của bạn đã bị từ chối.
      </p>
      {reason && (
        <Card className="text-left">
          <CardContent className="pt-4">
            <p className="text-sm"><strong>Lý do:</strong> {reason}</p>
          </CardContent>
        </Card>
      )}
      <p className="text-sm text-muted-foreground">
        Vui lòng liên hệ admin để biết thêm chi tiết.
      </p>
    </div>
  )
}

// ─── Reseller Dashboard ───────────────────────────────────────────────────────

function ResellerDashboard() {
  const { toast } = useToast()

  // Profile & Stats
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Keys
  const [keys, setKeys] = useState<any[]>([])
  const [keysPage, setKeysPage] = useState(1)
  const [keysTotalPages, setKeysTotalPages] = useState(1)
  const [keysFilter, setKeysFilter] = useState('all')
  const [keysLoading, setKeysLoading] = useState(false)

  // Plans
  const [plans, setPlans] = useState<any[]>([])
  const [plansLoading, setPlansLoading] = useState(false)

  // Dialogs
  const [showBuyDialog, setShowBuyDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [buyQuantity, setBuyQuantity] = useState(1)
  const [buyLoading, setBuyLoading] = useState(false)

  const [showFreeKeyDialog, setShowFreeKeyDialog] = useState(false)
  const [freeKeyQuantity, setFreeKeyQuantity] = useState(1)
  const [freeKeyLoading, setFreeKeyLoading] = useState(false)
  const [generatedKeys, setGeneratedKeys] = useState<any[]>([])

  // ─── Fetch ──────────────────────────────────────────────────────────

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/reseller/profile')
      const data = await res.json()
      if (res.ok) setProfile(data.reseller)
    } catch {}
  }

  const fetchKeys = async () => {
    setKeysLoading(true)
    try {
      const apiKey = profile?.apiKeys?.[0]?.apiKey
      if (!apiKey) return

      const params = new URLSearchParams({ page: String(keysPage), limit: '15' })
      if (keysFilter !== 'all') params.set('type', keysFilter)

      const res = await fetch(`/api/reseller/keys?${params}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      const data = await res.json()
      if (res.ok) {
        setKeys(data.keys)
        setKeysTotalPages(data.pagination.totalPages)
      }
    } catch {} finally {
      setKeysLoading(false)
    }
  }

  const fetchPlans = async () => {
    setPlansLoading(true)
    try {
      const apiKey = profile?.apiKeys?.[0]?.apiKey
      if (!apiKey) return

      const res = await fetch('/api/reseller/plans', {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      const data = await res.json()
      if (res.ok) setPlans(data.plans)
    } catch {} finally {
      setPlansLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const apiKey = profile?.apiKeys?.[0]?.apiKey
      if (!apiKey) return

      const res = await fetch('/api/reseller/stats', {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      const data = await res.json()
      if (res.ok) setStats(data.stats)
    } catch {}
  }

  useEffect(() => {
    fetchProfile().finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (profile?.apiKeys?.[0]) {
      fetchKeys()
      fetchPlans()
      fetchStats()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, keysPage, keysFilter])

  // ─── Actions ────────────────────────────────────────────────────────

  const handleBuyKeys = async () => {
    if (!selectedPlan || !profile?.apiKeys?.[0]) return
    setBuyLoading(true)
    try {
      const res = await fetch('/api/reseller/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${profile.apiKeys[0].apiKey}`,
        },
        body: JSON.stringify({ planId: selectedPlan.id, quantity: buyQuantity }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'Thành công!', description: `Đã mua ${data.quantity} keys` })
        setShowBuyDialog(false)
        fetchProfile()
        fetchKeys()
        fetchStats()
      } else {
        throw new Error(data.message || data.error)
      }
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' })
    } finally {
      setBuyLoading(false)
    }
  }

  const handleGenerateFreeKeys = async () => {
    if (!profile?.apiKeys?.[0]) return
    setFreeKeyLoading(true)
    setGeneratedKeys([])
    try {
      const res = await fetch('/api/reseller/free-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${profile.apiKeys[0].apiKey}`,
        },
        body: JSON.stringify({ quantity: freeKeyQuantity }),
      })
      const data = await res.json()
      if (res.ok) {
        setGeneratedKeys(data.keys)
        toast({ title: 'Thành công!', description: `Đã tạo ${data.generated} free keys` })
        fetchProfile()
        fetchStats()
      } else {
        throw new Error(data.message || data.error)
      }
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' })
    } finally {
      setFreeKeyLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: 'Đã copy!' })
  }

  const copyAllKeys = () => {
    const allKeys = generatedKeys.map(k => k.key).join('\n')
    navigator.clipboard.writeText(allKeys)
    toast({ title: 'Đã copy tất cả keys!' })
  }

  // ─── Loading ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Không thể tải thông tin reseller
      </div>
    )
  }

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Reseller Dashboard</h1>
          <p className="text-muted-foreground">
            Xin chào, {profile.businessName} {statusBadge(profile.status)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/profile/reseller/api-docs">
            <Button variant="outline">
              <BookOpen className="h-4 w-4 mr-2" />
              API Docs
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Số dư</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(profile.balance)}</div>
            <p className="text-xs text-muted-foreground">Chiết khấu: {profile.discountPercent}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng chi tiêu</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(profile.totalSpent)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalKeys || profile.totalKeys || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.purchasedKeys || 0} mua, {stats?.freeKeys || 0} free
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Free Key Quota</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.quota?.daily?.remaining === -1 ? '∞' : stats?.quota?.daily?.remaining ?? '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              Còn lại hôm nay ({stats?.quota?.daily?.limit === 0 ? 'không giới hạn' : `${stats?.quota?.daily?.used || 0}/${stats?.quota?.daily?.limit}`})
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => { setGeneratedKeys([]); setShowFreeKeyDialog(true) }}>
          <Zap className="h-4 w-4 mr-2" />
          Tạo Free Key
        </Button>
        <Button variant="outline" onClick={() => { fetchPlans(); setShowBuyDialog(true); setBuyQuantity(1) }}>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Mua Key
        </Button>
        <Button variant="ghost" onClick={() => { fetchProfile(); fetchKeys(); fetchStats() }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Làm mới
        </Button>
      </div>

      {/* Tabs: Keys & API Info */}
      <Tabs defaultValue="keys">
        <TabsList>
          <TabsTrigger value="keys">Danh sách Key</TabsTrigger>
          <TabsTrigger value="api-info">Thông tin API</TabsTrigger>
        </TabsList>

        {/* Keys Tab */}
        <TabsContent value="keys" className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={keysFilter} onValueChange={(v) => { setKeysFilter(v); setKeysPage(1) }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Loại key" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="PURCHASED">Đã mua</SelectItem>
                <SelectItem value="FREE">Free</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {keysLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có key nào. Hãy tạo free key hoặc mua key để bắt đầu!
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Hết hạn</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keys.map((k: any) => (
                      <TableRow key={k.id}>
                        <TableCell className="font-mono text-xs">
                          {k.key?.substring(0, 24)}...
                          <Button
                            size="sm" variant="ghost" className="h-6 w-6 p-0 ml-1"
                            onClick={() => copyToClipboard(k.key)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Badge variant={k.type === 'FREE' ? 'secondary' : 'default'}>
                            {k.type === 'FREE' ? 'Free' : 'Mua'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{k.plan?.name || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={k.status === 'ACTIVE' ? 'default' : 'outline'}>
                            {k.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {k.expiresAt ? formatDate(k.expiresAt) : 'Lifetime'}
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(k.allocatedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {keysTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" disabled={keysPage <= 1} onClick={() => setKeysPage(keysPage - 1)}>
                    Trước
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {keysPage} / {keysTotalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={keysPage >= keysTotalPages} onClick={() => setKeysPage(keysPage + 1)}>
                    Sau
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* API Info Tab */}
        <TabsContent value="api-info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API Key của bạn</CardTitle>
              <CardDescription>Sử dụng key này trong header Authorization khi gọi API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.apiKeys?.length > 0 ? (
                profile.apiKeys.map((ak: any) => (
                  <div key={ak.id} className="flex items-center gap-2 bg-muted p-3 rounded-md">
                    <code className="flex-1 text-sm font-mono break-all">{ak.apiKey}</code>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(ak.apiKey)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>Chưa có API Key. Liên hệ admin để được cấp.</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cấu hình hiện tại</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Chiết khấu</p>
                  <p className="font-semibold">{profile.discountPercent}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Max keys/đơn</p>
                  <p className="font-semibold">{profile.maxKeysPerOrder}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Quota free key/ngày</p>
                  <p className="font-semibold">{profile.freeKeyQuotaDaily === 0 ? 'Không giới hạn' : profile.freeKeyQuotaDaily}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Quota free key/tháng</p>
                  <p className="font-semibold">{profile.freeKeyQuotaMonthly === 0 ? 'Không giới hạn' : profile.freeKeyQuotaMonthly}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Free Key Plan</p>
                  <p className="font-semibold">{profile.freeKeyPlan?.name || 'Chưa thiết lập'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link href="/profile/reseller/api-docs">
              <Button variant="outline">
                <BookOpen className="h-4 w-4 mr-2" />
                Xem hướng dẫn API đầy đủ
              </Button>
            </Link>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── Free Key Dialog ───────────────────────────────────────────── */}
      <Dialog open={showFreeKeyDialog} onOpenChange={setShowFreeKeyDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tạo Free Key</DialogTitle>
            <DialogDescription>
              Tạo key miễn phí cho khách hàng. Plan: {profile.freeKeyPlan?.name || 'Chưa thiết lập'}
            </DialogDescription>
          </DialogHeader>

          {!profile.freeKeyPlan ? (
            <div className="flex items-center gap-2 text-orange-500 py-4">
              <AlertCircle className="h-5 w-5" />
              <p>Admin chưa thiết lập Free Key Plan. Vui lòng liên hệ admin.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <Label>Số lượng (tối đa 50/lần)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={freeKeyQuantity}
                    onChange={(e) => setFreeKeyQuantity(Math.min(50, Math.max(1, Number(e.target.value))))}
                  />
                </div>

                {/* Generated Keys Result */}
                {generatedKeys.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-green-600">
                        <CheckCircle2 className="h-4 w-4 inline mr-1" />
                        Đã tạo {generatedKeys.length} keys:
                      </Label>
                      <Button size="sm" variant="outline" onClick={copyAllKeys}>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy tất cả
                      </Button>
                    </div>
                    <div className="bg-muted rounded-md p-3 max-h-[200px] overflow-y-auto space-y-1">
                      {generatedKeys.map((k: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <code className="text-xs font-mono flex-1 break-all">{k.key}</code>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 shrink-0" onClick={() => copyToClipboard(k.key)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Hết hạn: {generatedKeys[0]?.expiresAt ? formatDate(generatedKeys[0].expiresAt) : 'Lifetime'}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowFreeKeyDialog(false)}>Đóng</Button>
                <Button onClick={handleGenerateFreeKeys} disabled={freeKeyLoading}>
                  {freeKeyLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Zap className="h-4 w-4 mr-2" />
                  Tạo Key
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Buy Keys Dialog ───────────────────────────────────────────── */}
      <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Mua Key</DialogTitle>
            <DialogDescription>
              Chọn plan và số lượng. Số dư hiện tại: {formatCurrency(profile.balance)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {plansLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : plans.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Không có plan nào</p>
            ) : (
              <>
                <div className="grid gap-3 max-h-[300px] overflow-y-auto">
                  {plans.map((plan: any) => (
                    <div
                      key={plan.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedPlan?.id === plan.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedPlan(plan)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{plan.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {plan.durationType} × {plan.durationValue} | Max {plan.maxDevices} devices
                          </p>
                        </div>
                        <div className="text-right">
                          {plan.originalPrice !== plan.resellerPrice && (
                            <p className="text-xs text-muted-foreground line-through">
                              {formatCurrency(plan.originalPrice)}
                            </p>
                          )}
                          <p className="font-bold text-green-600">
                            {formatCurrency(plan.resellerPrice)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedPlan && (
                  <div className="space-y-3 border-t pt-3">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label>Số lượng</Label>
                        <Input
                          type="number"
                          min="1"
                          max={profile.maxKeysPerOrder}
                          value={buyQuantity}
                          onChange={(e) => setBuyQuantity(Math.max(1, Number(e.target.value)))}
                        />
                      </div>
                      <div className="text-right pt-5">
                        <p className="text-sm text-muted-foreground">Tổng cộng:</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(selectedPlan.resellerPrice * buyQuantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBuyDialog(false)}>Hủy</Button>
            <Button
              onClick={handleBuyKeys}
              disabled={!selectedPlan || buyLoading}
            >
              {buyLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <ShoppingCart className="h-4 w-4 mr-2" />
              Mua {buyQuantity} keys
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ResellerPage() {
  const { data: session, status } = useSession()
  const [resellerStatus, setResellerStatus] = useState<string | null>(null)
  const [resellerData, setResellerData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  const checkResellerStatus = async () => {
    try {
      const res = await fetch('/api/reseller/profile')
      if (res.ok) {
        const data = await res.json()
        setResellerStatus(data.reseller.status)
        setResellerData(data.reseller)
      } else if (res.status === 404) {
        setResellerStatus(null) // Not registered
      }
    } catch {
      setResellerStatus(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      checkResellerStatus()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {resellerStatus === null && (
        <ResellerRegistration onSuccess={checkResellerStatus} />
      )}
      {resellerStatus === 'PENDING' && <ResellerPending />}
      {resellerStatus === 'REJECTED' && <ResellerRejected reason={resellerData?.rejectedReason} />}
      {resellerStatus === 'SUSPENDED' && (
        <div className="max-w-lg mx-auto text-center space-y-4 py-12">
          <AlertCircle className="h-16 w-16 mx-auto text-orange-400" />
          <h2 className="text-2xl font-bold">Tài khoản tạm ngưng</h2>
          <p className="text-muted-foreground">
            Tài khoản reseller của bạn đang bị tạm ngưng. Vui lòng liên hệ admin.
          </p>
        </div>
      )}
      {resellerStatus === 'APPROVED' && <ResellerDashboard />}
    </div>
  )
}

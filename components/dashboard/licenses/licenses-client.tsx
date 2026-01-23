'use client'

import { useState, useEffect, useCallback } from 'react'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  MoreHorizontal,
  Key,
  Copy,
  RefreshCw,
  Ban,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  UserPlus,
  UserMinus,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { formatDateVN } from '@/lib/utils'

interface License {
  id: string
  key: string
  status: string
  activatedAt: string | Date | null
  expiresAt: string | Date | null
  maxDevices: number
  currentDevices: number
  totalActivations: number
  lastUsedAt: string | Date | null
  notes: string | null
  createdAt: string
  plan: {
    id: string
    name: string
    durationType: string
    durationValue: number
  }
  user: {
    id: string
    name: string | null
    email: string
  } | null
  _count: {
    activations: number
  }
}

interface Plan {
  id: string
  name: string
  durationType: string
  durationValue: number
}

interface UserSearchResult {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string
  licenseCount: number
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary'; icon: any }> = {
  INACTIVE: { label: 'Chưa kích hoạt', variant: 'secondary', icon: Clock },
  ACTIVE: { label: 'Đang hoạt động', variant: 'success', icon: CheckCircle },
  EXPIRED: { label: 'Hết hạn', variant: 'warning', icon: AlertCircle },
  SUSPENDED: { label: 'Tạm khóa', variant: 'warning', icon: AlertCircle },
  REVOKED: { label: 'Thu hồi', variant: 'destructive', icon: XCircle },
  BANNED: { label: 'Bị cấm', variant: 'destructive', icon: Ban },
}

export function LicensesClient() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  
  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createForm, setCreateForm] = useState({
    planId: '',
    count: 1,
    notes: '',
  })
  
  // Detail dialog state
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null)
  const [selectedLicenseDetail, setSelectedLicenseDetail] = useState<any>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  
  // Assign user dialog state
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignLicenseId, setAssignLicenseId] = useState<string | null>(null)
  const [userSearch, setUserSearch] = useState('')
  const [userSearchResults, setUserSearchResults] = useState<UserSearchResult[]>([])
  const [userSearchLoading, setUserSearchLoading] = useState(false)
  const [assignLoading, setAssignLoading] = useState(false)
  
  const fetchLicenses = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (planFilter !== 'all') params.set('planId', planFilter)
      
      const res = await fetch(`/api/admin/licenses?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setLicenses(data.data.licenses)
        setPagination(data.data.pagination)
      }
    } catch (error) {
      toast.error('Không thể tải danh sách licenses')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, search, statusFilter, planFilter])
  
  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/plans')
      const data = await res.json()
      
      if (data.success) {
        setPlans(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    }
  }, [])
  
  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])
  
  useEffect(() => {
    fetchLicenses()
  }, [fetchLicenses])
  
  const handleCreate = async () => {
    if (!createForm.planId) {
      toast.error('Vui lòng chọn gói cước')
      return
    }
    
    try {
      setCreateLoading(true)
      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast.success(data.message)
        setCreateOpen(false)
        setCreateForm({ planId: '', count: 1, notes: '' })
        fetchLicenses()
        
        // Copy key(s) to clipboard
        if (data.data.keys) {
          const keys = data.data.keys.map((k: any) => k.key).join('\n')
          await navigator.clipboard.writeText(keys)
          toast.info(`Đã copy ${data.data.keys.length} keys vào clipboard`)
        } else if (data.data.licenseKey) {
          await navigator.clipboard.writeText(data.data.licenseKey.key)
          toast.info('Đã copy key vào clipboard')
        }
      } else {
        toast.error(data.message || 'Có lỗi xảy ra')
      }
    } catch (error) {
      toast.error('Không thể tạo license')
    } finally {
      setCreateLoading(false)
    }
  }
  
  const handleAction = async (licenseId: string, action: string, data?: any) => {
    try {
      const res = await fetch(`/api/admin/licenses/${licenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      })
      
      const result = await res.json()
      
      if (result.success) {
        toast.success(result.message)
        fetchLicenses()
      } else {
        toast.error(result.message || 'Có lỗi xảy ra')
      }
    } catch (error) {
      toast.error('Không thể thực hiện thao tác')
    }
  }
  
  const handleDelete = async (licenseId: string) => {
    if (!confirm('Bạn có chắc muốn xóa license này?')) return
    
    try {
      const res = await fetch(`/api/admin/licenses/${licenseId}`, {
        method: 'DELETE',
      })
      
      const result = await res.json()
      
      if (result.success) {
        toast.success(result.message)
        fetchLicenses()
      } else {
        toast.error(result.message || 'Có lỗi xảy ra')
      }
    } catch (error) {
      toast.error('Không thể xóa license')
    }
  }
  
  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key)
    toast.success('Đã copy key')
  }
  
  // Search users for assigning
  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setUserSearchResults([])
      return
    }
    
    try {
      setUserSearchLoading(true)
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      
      if (data.success) {
        setUserSearchResults(data.data)
      }
    } catch (error) {
      console.error('Failed to search users:', error)
    } finally {
      setUserSearchLoading(false)
    }
  }, [])
  
  // Debounce user search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(userSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [userSearch, searchUsers])
  
  // Assign user to license
  const handleAssignUser = async (userId: string | null) => {
    if (!assignLicenseId) return
    
    try {
      setAssignLoading(true)
      const res = await fetch(`/api/admin/licenses/${assignLicenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      
      const result = await res.json()
      
      if (result.success) {
        toast.success(userId ? 'Đã gán key cho người dùng' : 'Đã gỡ người dùng khỏi key')
        setAssignOpen(false)
        setAssignLicenseId(null)
        setUserSearch('')
        setUserSearchResults([])
        fetchLicenses()
      } else {
        toast.error(result.message || 'Có lỗi xảy ra')
      }
    } catch (error) {
      toast.error('Không thể cập nhật')
    } finally {
      setAssignLoading(false)
    }
  }
  
  // Fetch license detail with activations
  const fetchLicenseDetail = async (licenseId: string) => {
    try {
      setDetailLoading(true)
      const res = await fetch(`/api/admin/licenses/${licenseId}`)
      const data = await res.json()
      
      if (data.success) {
        setSelectedLicenseDetail(data.data)
      } else {
        toast.error('Không thể tải chi tiết license')
      }
    } catch (error) {
      toast.error('Lỗi khi tải chi tiết')
    } finally {
      setDetailLoading(false)
    }
  }
  
  // Open detail dialog and fetch full data
  const openDetailDialog = (license: License) => {
    setSelectedLicense(license)
    setDetailOpen(true)
    fetchLicenseDetail(license.id)
  }
  
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date || date === 'null' || date === 'undefined') return '-'
    // Convert to string if it's a Date object
    let dateStr: string
    if (date instanceof Date) {
      dateStr = date.toISOString()
    } else {
      dateStr = date
    }
    // Parse as UTC to match server timezone
    const utcDate = new Date(dateStr)
    if (isNaN(utcDate.getTime())) return '-'
    return formatDistanceToNow(utcDate, { addSuffix: true, locale: vi })
  }

  // Format datetime for expiration dates - shows actual date instead of relative time
  const formatExpirationDate = (date: string | Date | null | undefined) => {
    // Handle null/undefined/null string
    if (!date || date === 'null' || date === 'undefined') return 'Vĩnh viễn'
    
    // Convert to string if it's a Date object
    let dateStr: string
    if (date instanceof Date) {
      dateStr = date.toISOString()
    } else {
      dateStr = date
    }
    
    // Parse as UTC to match server timezone
    const utcDate = new Date(dateStr)
    if (isNaN(utcDate.getTime())) return 'Vĩnh viễn'
    
    // Show actual date in Vietnam timezone
    return utcDate.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Format remaining time in human-readable format
  const formatRemainingTime = (expiresAt: string | Date | null | undefined) => {
    // Handle null/undefined/null string (lifetime keys)
    if (!expiresAt || expiresAt === 'null' || expiresAt === 'undefined') {
      return { text: 'Vĩnh viễn', className: 'text-green-600', expiresAt: null }
    }

    // Parse the date
    let dateStr: string
    if (expiresAt instanceof Date) {
      dateStr = expiresAt.toISOString()
    } else {
      dateStr = expiresAt
    }

    const expiryDate = new Date(dateStr)
    if (isNaN(expiryDate.getTime())) {
      return { text: 'Vĩnh viễn', className: 'text-green-600', expiresAt: null }
    }

    // Calculate remaining time using UTC
    const now = new Date(Date.now())
    const diffMs = expiryDate.getTime() - now.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    // If expired
    if (diffMs <= 0) {
      return { text: 'Đã hết hạn', className: 'text-red-600', expiresAt: formatDateVN(expiresAt) }
    }

    // Build remaining time string
    let parts: string[] = []

    if (diffDays > 0) {
      parts.push(`${diffDays} ngày`)
    }

    const remainingHours = diffHours % 24
    if (remainingHours > 0) {
      parts.push(`${remainingHours} tiếng`)
    }

    const remainingMinutes = diffMinutes % 60
    if (remainingMinutes > 0 && diffDays === 0) {
      // Only show minutes if less than 1 day
      parts.push(`${remainingMinutes} phút`)
    }

    const text = parts.join(' ') + ' còn lại'

    // Add warning color if expiring soon (less than 1 day)
    let className = 'text-foreground'
    if (diffDays === 0) {
      className = 'text-orange-600 font-medium'
    }
    if (diffHours < 1) {
      className = 'text-red-600 font-bold'
    }

    return { text, className, expiresAt: formatDateVN(expiresAt) }
  }

  // Format datetime using UTC for consistent Vietnam timezone display
  const formatDateTime = (date: string | Date | null | undefined) => {
    if (!date || date === 'null' || date === 'undefined') return '-'
    return formatDateVN(date)
  }

  // Format datetime for logs
  const formatLogDateTime = (date: string | Date) => {
    if (!date || date === 'null' || date === 'undefined') return '-'
    // Convert to string if it's a Date object
    let dateStr: string
    if (date instanceof Date) {
      dateStr = date.toISOString()
    } else {
      dateStr = date
    }
    const utcDate = new Date(dateStr)
    if (isNaN(utcDate.getTime())) return '-'
    return utcDate.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo key, email, tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="INACTIVE">Chưa kích hoạt</SelectItem>
            <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
            <SelectItem value="EXPIRED">Hết hạn</SelectItem>
            <SelectItem value="SUSPENDED">Tạm khóa</SelectItem>
            <SelectItem value="REVOKED">Thu hồi</SelectItem>
            <SelectItem value="BANNED">Bị cấm</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Gói cước" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả gói</SelectItem>
            {plans.map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tạo Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo License Key</DialogTitle>
              <DialogDescription>
                Tạo license key mới cho khách hàng
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Gói cước *</Label>
                <Select
                  value={createForm.planId}
                  onValueChange={(v) => setCreateForm({ ...createForm, planId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn gói cước" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.filter(p => !p.deletedAt).map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Số lượng key</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={createForm.count}
                  onChange={(e) => setCreateForm({ ...createForm, count: parseInt(e.target.value) || 1 })}
                />
                <p className="text-xs text-muted-foreground">Tối đa 100 keys một lần</p>
              </div>
              
              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <Textarea
                  placeholder="Ghi chú nội bộ..."
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleCreate} disabled={createLoading}>
                {createLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Tạo Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Gói cước</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thiết bị</TableHead>
              <TableHead>Hết hạn</TableHead>
              <TableHead>Người dùng</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : licenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Không có license nào
                </TableCell>
              </TableRow>
            ) : (
              licenses.map((license) => {
                const status = statusConfig[license.status] || statusConfig.INACTIVE
                const StatusIcon = status.icon
                
                return (
                  <TableRow key={license.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        <code className="text-sm font-mono">{license.key}</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyKey(license.key)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{license.plan.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant as any}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {license._count.activations}/{license.maxDevices}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const { text, className, expiresAt } = formatRemainingTime(license.expiresAt)
                        return (
                          <div className="flex flex-col">
                            <span className={className}>{text}</span>
                            {expiresAt && (
                              <span className="text-xs text-muted-foreground">Hết hạn: {expiresAt}</span>
                            )}
                          </div>
                        )
                      })()}
                    </TableCell>
                    <TableCell>
                      {license.user ? (
                        <span className="text-sm">{license.user.email}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Chưa gán</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            openDetailDialog(license)
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyKey(license.key)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy key
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            setAssignLicenseId(license.id)
                            setAssignOpen(true)
                          }}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Gán cho người dùng
                          </DropdownMenuItem>
                          {license.user && (
                            <DropdownMenuItem onClick={() => {
                              setAssignLicenseId(license.id)
                              handleAssignUser(null)
                            }}>
                              <UserMinus className="h-4 w-4 mr-2" />
                              Gỡ người dùng
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleAction(license.id, 'reset_hwid')}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reset HWID
                          </DropdownMenuItem>
                          {license.status === 'ACTIVE' && (
                            <DropdownMenuItem onClick={() => handleAction(license.id, 'suspend')}>
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Tạm khóa
                            </DropdownMenuItem>
                          )}
                          {license.status === 'SUSPENDED' && (
                            <DropdownMenuItem onClick={() => handleAction(license.id, 'activate')}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Kích hoạt lại
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleAction(license.id, 'revoke')}
                            className="text-destructive"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Thu hồi
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(license.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Hiển thị {licenses.length} / {pagination.total} licenses
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
      
      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={(open) => {
        setDetailOpen(open)
        if (!open) {
          setSelectedLicenseDetail(null)
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết License</DialogTitle>
          </DialogHeader>
          
          {detailLoading ? (
            <div className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-2 text-muted-foreground">Đang tải...</p>
            </div>
          ) : selectedLicenseDetail ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Key</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="font-mono text-sm bg-muted px-2 py-1 rounded">{selectedLicenseDetail.key}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyKey(selectedLicenseDetail.key)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Trạng thái</Label>
                  <div className="mt-1">
                    <Badge variant={statusConfig[selectedLicenseDetail.status]?.variant as any}>
                      {statusConfig[selectedLicenseDetail.status]?.label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Gói cước</Label>
                  <p className="mt-1">{selectedLicenseDetail.plan?.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Thiết bị</Label>
                  <p className="mt-1">{selectedLicenseDetail.activations?.filter((a: any) => a.status === 'ACTIVE').length || 0}/{selectedLicenseDetail.maxDevices}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ngày kích hoạt</Label>
                  <p className="mt-1">{formatDateTime(selectedLicenseDetail.activatedAt)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ngày hết hạn</Label>
                  <p className="mt-1">
                    {(() => {
                      const { text, className, expiresAt } = formatRemainingTime(selectedLicenseDetail.expiresAt)
                      return (
                        <div className="flex flex-col">
                          <span className={className}>{text}</span>
                          {expiresAt && (
                            <span className="text-xs text-muted-foreground">{expiresAt}</span>
                          )}
                        </div>
                      )
                    })()}
                  </p>
                </div>
              </div>
              
              {/* Assigned User */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-muted-foreground">Người dùng được gán</Label>
                    {selectedLicenseDetail.user ? (
                      <div className="mt-1">
                        <p className="font-medium">{selectedLicenseDetail.user.name || 'Chưa có tên'}</p>
                        <p className="text-sm text-muted-foreground">{selectedLicenseDetail.user.email}</p>
                      </div>
                    ) : (
                      <p className="mt-1 text-muted-foreground">Chưa gán cho ai</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAssignLicenseId(selectedLicenseDetail.id)
                      setAssignOpen(true)
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {selectedLicenseDetail.user ? 'Đổi người dùng' : 'Gán người dùng'}
                  </Button>
                </div>
              </div>
              
              {/* Activations - Device Info */}
              <div>
                <Label className="text-muted-foreground mb-2 block">Thiết bị đã kích hoạt ({selectedLicenseDetail.activations?.length || 0})</Label>
                {selectedLicenseDetail.activations && selectedLicenseDetail.activations.length > 0 ? (
                  <div className="space-y-3">
                    {selectedLicenseDetail.activations.map((activation: any) => {
                      let deviceInfo = null
                      try {
                        deviceInfo = activation.deviceInfo ? JSON.parse(activation.deviceInfo) : null
                      } catch (e) {
                        deviceInfo = null
                      }
                      
                      return (
                        <div key={activation.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant={activation.status === 'ACTIVE' ? 'success' : 'secondary'}>
                                {activation.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã gỡ'}
                              </Badge>
                              <span className="font-medium">{activation.deviceName || 'Không có tên'}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(activation.lastSeenAt)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">HWID:</span>
                              <code className="ml-2 text-xs bg-muted px-1 rounded">{activation.hwid?.substring(0, 16)}...</code>
                            </div>
                            <div>
                              <span className="text-muted-foreground">IP:</span>
                              <span className="ml-2">{activation.ipAddress || '-'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Kích hoạt:</span>
                              <span className="ml-2">{formatDateTime(activation.activatedAt)}</span>
                            </div>
                            {activation.deactivatedAt && (
                              <div>
                                <span className="text-muted-foreground">Gỡ lúc:</span>
                                <span className="ml-2">{formatDateTime(activation.deactivatedAt)}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Device Info from App */}
                          {deviceInfo && (
                            <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Thông tin thiết bị từ App:</p>
                              <div className="grid grid-cols-2 gap-1 text-xs">
                                {deviceInfo.os && (
                                  <div><span className="text-muted-foreground">OS:</span> {deviceInfo.os}</div>
                                )}
                                {deviceInfo.osVersion && (
                                  <div><span className="text-muted-foreground">Version:</span> {deviceInfo.osVersion}</div>
                                )}
                                {deviceInfo.cpu && (
                                  <div><span className="text-muted-foreground">CPU:</span> {deviceInfo.cpu}</div>
                                )}
                                {deviceInfo.ram && (
                                  <div><span className="text-muted-foreground">RAM:</span> {deviceInfo.ram}</div>
                                )}
                                {deviceInfo.gpu && (
                                  <div><span className="text-muted-foreground">GPU:</span> {deviceInfo.gpu}</div>
                                )}
                                {deviceInfo.computerName && (
                                  <div><span className="text-muted-foreground">PC Name:</span> {deviceInfo.computerName}</div>
                                )}
                                {deviceInfo.appVersion && (
                                  <div><span className="text-muted-foreground">App Version:</span> {deviceInfo.appVersion}</div>
                                )}
                                {deviceInfo.screenResolution && (
                                  <div><span className="text-muted-foreground">Screen:</span> {deviceInfo.screenResolution}</div>
                                )}
                              </div>
                              {/* Show raw JSON if there are other fields */}
                              {Object.keys(deviceInfo).filter(k => !['os', 'osVersion', 'cpu', 'ram', 'gpu', 'computerName', 'appVersion', 'screenResolution'].includes(k)).length > 0 && (
                                <details className="mt-2">
                                  <summary className="text-xs text-muted-foreground cursor-pointer">Xem thêm...</summary>
                                  <pre className="mt-1 text-xs overflow-x-auto">{JSON.stringify(deviceInfo, null, 2)}</pre>
                                </details>
                              )}
                            </div>
                          )}
                          
                          {/* User Agent */}
                          {activation.userAgent && (
                            <details className="text-xs">
                              <summary className="text-muted-foreground cursor-pointer">User Agent</summary>
                              <p className="mt-1 break-all">{activation.userAgent}</p>
                            </details>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Chưa có thiết bị nào kích hoạt</p>
                )}
              </div>
              
              {/* Usage Logs */}
              {selectedLicenseDetail.usageLogs && selectedLicenseDetail.usageLogs.length > 0 && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Lịch sử hoạt động (50 gần nhất)</Label>
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Thời gian</TableHead>
                          <TableHead className="text-xs">Hành động</TableHead>
                          <TableHead className="text-xs">IP</TableHead>
                          <TableHead className="text-xs">Kết quả</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedLicenseDetail.usageLogs.map((log: any) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-xs">{formatLogDateTime(log.createdAt)}</TableCell>
                            <TableCell className="text-xs">
                              <Badge variant="outline" className="text-xs">{log.action}</Badge>
                            </TableCell>
                            <TableCell className="text-xs">{log.ipAddress || '-'}</TableCell>
                            <TableCell className="text-xs">
                              {log.success ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <XCircle className="h-3 w-3 text-red-500" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              
              {/* Notes */}
              {selectedLicenseDetail.notes && (
                <div>
                  <Label className="text-muted-foreground">Ghi chú</Label>
                  <p className="mt-1 text-sm p-3 bg-muted rounded-lg">{selectedLicenseDetail.notes}</p>
                </div>
              )}
            </div>
          ) : selectedLicense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Key</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="font-mono">{selectedLicense.key}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyKey(selectedLicense.key)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Trạng thái</Label>
                  <div className="mt-1">
                    <Badge variant={statusConfig[selectedLicense.status]?.variant as any}>
                      {statusConfig[selectedLicense.status]?.label}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Assign User Dialog */}
      <Dialog open={assignOpen} onOpenChange={(open) => {
        setAssignOpen(open)
        if (!open) {
          setUserSearch('')
          setUserSearchResults([])
          setAssignLicenseId(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gán License cho người dùng</DialogTitle>
            <DialogDescription>
              Tìm kiếm và chọn người dùng để gán license key
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tìm người dùng</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nhập email hoặc tên..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">Nhập ít nhất 2 ký tự để tìm kiếm</p>
            </div>
            
            {/* Search Results */}
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {userSearchLoading ? (
                <div className="p-4 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </div>
              ) : userSearchResults.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  {userSearch.length >= 2 ? 'Không tìm thấy người dùng' : 'Nhập để tìm kiếm...'}
                </div>
              ) : (
                <div className="divide-y">
                  {userSearchResults.map((user) => (
                    <button
                      key={user.id}
                      className="w-full p-3 text-left hover:bg-muted flex items-center justify-between transition-colors"
                      onClick={() => handleAssignUser(user.id)}
                      disabled={assignLoading}
                    >
                      <div>
                        <p className="font-medium">{user.name || 'Chưa có tên'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {user.licenseCount} key
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Link2,
  Type,
  Code2,
  Mail,
  Filter,
  TestTube,
  Upload,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Eye,
  EyeOff,
  Ban,
  Flag,
} from 'lucide-react'

interface ReviewFilter {
  id: string
  type: string
  value: string
  action: string
  isActive: boolean
  description: string | null
  matchCount: number
  createdAt: string
  updatedAt: string
}

interface FilterStats {
  total: number
  active: number
  byType: {
    keyword: number
    url: number
    regex: number
    email: number
  }
  totalMatches: number
}

interface TestResult {
  blocked: boolean
  action: string
  matchedFilters: {
    id: string
    type: string
    value: string
    action: string
  }[]
  reason?: string
}

const FILTER_TYPES = [
  { value: 'keyword', label: 'Từ khóa', icon: Type, description: 'Chặn theo từ/cụm từ cụ thể' },
  { value: 'url', label: 'URL', icon: Link2, description: 'Chặn link/URL trong review' },
  { value: 'regex', label: 'Regex', icon: Code2, description: 'Pattern matching nâng cao' },
  { value: 'email', label: 'Email', icon: Mail, description: 'Chặn theo domain/email' },
]

const FILTER_ACTIONS = [
  { value: 'block', label: 'Chặn hoàn toàn', icon: Ban, color: 'text-red-600', bgColor: 'bg-red-100' },
  { value: 'hide', label: 'Ẩn (cần duyệt)', icon: EyeOff, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { value: 'flag', label: 'Đánh dấu', icon: Flag, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
]

// Preset keyword lists
const PRESET_KEYWORDS = {
  spam: [
    'mua ngay', 'click here', 'free money', 'giảm giá sốc', 'link tải',
    'miễn phí 100%', 'hack', 'cheat', 'crack', 'keygen', 'serial key',
    'buy now', 'limited offer', 'act now', 'casino', 'betting',
  ],
  offensive: [
    'đm', 'dcm', 'vl', 'cc', 'clm', 'đkm', 'ngu',
    'stupid', 'idiot', 'scam', 'lừa đảo', 'rác',
  ],
  urls: ['*'],
}

export default function ReviewFilterManagement() {
  const [filters, setFilters] = useState<ReviewFilter[]>([])
  const [stats, setStats] = useState<FilterStats>({
    total: 0,
    active: 0,
    byType: { keyword: 0, url: 0, regex: 0, email: 0 },
    totalMatches: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 })

  // Dialog states
  const [createDialog, setCreateDialog] = useState(false)
  const [editDialog, setEditDialog] = useState(false)
  const [testDialog, setTestDialog] = useState(false)
  const [bulkDialog, setBulkDialog] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    type: 'keyword',
    value: '',
    action: 'block',
    description: '',
    isActive: true,
  })
  const [editingFilter, setEditingFilter] = useState<ReviewFilter | null>(null)

  // Test state
  const [testInput, setTestInput] = useState({ title: '', content: '', guestName: '', guestEmail: '' })
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [testLoading, setTestLoading] = useState(false)

  // Bulk import state
  const [bulkText, setBulkText] = useState('')
  const [bulkType, setBulkType] = useState('keyword')
  const [bulkAction, setBulkAction] = useState('block')
  const [bulkLoading, setBulkLoading] = useState(false)

  // Review settings state
  const [reviewSettings, setReviewSettings] = useState({
    requireApproval: false,
    requireApprovalGuest: false,
  })
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)

  const fetchReviewSettings = useCallback(async () => {
    try {
      setSettingsLoading(true)
      const response = await fetch('/api/admin/review-settings')
      if (response.ok) {
        const data = await response.json()
        setReviewSettings({
          requireApproval: data.requireApproval ?? false,
          requireApprovalGuest: data.requireApprovalGuest ?? false,
        })
      }
    } catch (error) {
      console.error('Error fetching review settings:', error)
    } finally {
      setSettingsLoading(false)
    }
  }, [])

  const updateReviewSetting = async (key: string, value: boolean) => {
    try {
      setSettingsSaving(true)
      const response = await fetch('/api/admin/review-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })

      if (!response.ok) throw new Error('Failed to update setting')

      const data = await response.json()
      setReviewSettings({
        requireApproval: data.requireApproval ?? false,
        requireApprovalGuest: data.requireApprovalGuest ?? false,
      })
      toast.success(data.message || 'Đã cập nhật cài đặt')
    } catch (error) {
      toast.error('Lỗi khi cập nhật cài đặt')
    } finally {
      setSettingsSaving(false)
    }
  }

  const fetchFilters = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: pagination.page.toString(), limit: '50' })

      if (search) params.append('search', search)
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (activeFilter !== 'all') params.append('isActive', activeFilter)

      const response = await fetch(`/api/admin/review-filters?${params}`)
      if (!response.ok) throw new Error('Failed to fetch filters')

      const data = await response.json()
      setFilters(data.filters)
      setStats(data.stats)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching filters:', error)
      toast.error('Không thể tải danh sách bộ lọc')
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, activeFilter, pagination.page])

  useEffect(() => {
    fetchFilters()
  }, [fetchFilters])

  const handleCreate = async () => {
    try {
      if (!formData.value.trim()) {
        toast.error('Vui lòng nhập giá trị bộ lọc')
        return
      }

      const response = await fetch('/api/admin/review-filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to create filter')
      }

      toast.success('Đã tạo bộ lọc thành công')
      setCreateDialog(false)
      resetForm()
      fetchFilters()
    } catch (error: any) {
      toast.error(error.message || 'Không thể tạo bộ lọc')
    }
  }

  const handleUpdate = async () => {
    if (!editingFilter) return

    try {
      const response = await fetch('/api/admin/review-filters', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingFilter.id,
          type: formData.type,
          value: formData.value,
          action: formData.action,
          description: formData.description,
          isActive: formData.isActive,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to update filter')
      }

      toast.success('Đã cập nhật bộ lọc')
      setEditDialog(false)
      setEditingFilter(null)
      resetForm()
      fetchFilters()
    } catch (error: any) {
      toast.error(error.message || 'Không thể cập nhật bộ lọc')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/review-filters?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete filter')

      toast.success('Đã xóa bộ lọc')
      setDeleteConfirm(null)
      fetchFilters()
    } catch (error) {
      toast.error('Không thể xóa bộ lọc')
    }
  }

  const handleToggleActive = async (filter: ReviewFilter) => {
    try {
      const response = await fetch('/api/admin/review-filters', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: filter.id, isActive: !filter.isActive }),
      })

      if (!response.ok) throw new Error('Failed to toggle filter')

      setFilters(filters.map((f) =>
        f.id === filter.id ? { ...f, isActive: !f.isActive } : f
      ))
      toast.success(filter.isActive ? 'Đã tắt bộ lọc' : 'Đã bật bộ lọc')
    } catch (error) {
      toast.error('Không thể thay đổi trạng thái bộ lọc')
    }
  }

  const handleTest = async () => {
    try {
      setTestLoading(true)
      setTestResult(null)

      const response = await fetch('/api/admin/review-filters/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testInput),
      })

      if (!response.ok) throw new Error('Failed to test filters')

      const data = await response.json()
      setTestResult(data.result)
    } catch (error) {
      toast.error('Không thể kiểm tra bộ lọc')
    } finally {
      setTestLoading(false)
    }
  }

  const handleBulkImport = async () => {
    try {
      setBulkLoading(true)

      const lines = bulkText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      if (lines.length === 0) {
        toast.error('Vui lòng nhập ít nhất một giá trị')
        return
      }

      const filtersToImport = lines.map((value) => ({
        type: bulkType,
        value,
        action: bulkAction,
      }))

      const response = await fetch('/api/admin/review-filters/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: filtersToImport }),
      })

      if (!response.ok) throw new Error('Failed to import filters')

      const data = await response.json()
      toast.success(
        `Đã thêm ${data.results.created} bộ lọc, bỏ qua ${data.results.skipped}`
      )
      setBulkDialog(false)
      setBulkText('')
      fetchFilters()
    } catch (error) {
      toast.error('Không thể nhập bộ lọc hàng loạt')
    } finally {
      setBulkLoading(false)
    }
  }

  const handlePresetImport = async (presetKey: keyof typeof PRESET_KEYWORDS) => {
    const keywords = PRESET_KEYWORDS[presetKey]
    const type = presetKey === 'urls' ? 'url' : 'keyword'

    try {
      const filtersToImport = keywords.map((value) => ({
        type,
        value,
        action: 'block',
      }))

      const response = await fetch('/api/admin/review-filters/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: filtersToImport }),
      })

      if (!response.ok) throw new Error('Failed to import preset')

      const data = await response.json()
      toast.success(
        `Đã thêm ${data.results.created} bộ lọc từ preset "${presetKey}", bỏ qua ${data.results.skipped}`
      )
      fetchFilters()
    } catch (error) {
      toast.error('Không thể nhập preset')
    }
  }

  const resetForm = () => {
    setFormData({
      type: 'keyword',
      value: '',
      action: 'block',
      description: '',
      isActive: true,
    })
  }

  const openEditDialog = (filter: ReviewFilter) => {
    setEditingFilter(filter)
    setFormData({
      type: filter.type,
      value: filter.value,
      action: filter.action,
      description: filter.description || '',
      isActive: filter.isActive,
    })
    setEditDialog(true)
  }

  const getTypeIcon = (type: string) => {
    const typeInfo = FILTER_TYPES.find((t) => t.value === type)
    if (typeInfo) {
      const Icon = typeInfo.icon
      return <Icon className="h-4 w-4" />
    }
    return <Filter className="h-4 w-4" />
  }

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      keyword: 'bg-blue-100 text-blue-800',
      url: 'bg-purple-100 text-purple-800',
      regex: 'bg-green-100 text-green-800',
      email: 'bg-orange-100 text-orange-800',
    }
    const labels: Record<string, string> = {
      keyword: 'Từ khóa',
      url: 'URL',
      regex: 'Regex',
      email: 'Email',
    }
    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>
        {getTypeIcon(type)}
        <span className="ml-1">{labels[type] || type}</span>
      </Badge>
    )
  }

  const getActionBadge = (action: string) => {
    const actionInfo = FILTER_ACTIONS.find((a) => a.value === action)
    if (!actionInfo) return <Badge>{action}</Badge>

    const Icon = actionInfo.icon
    return (
      <Badge className={`${actionInfo.bgColor} ${actionInfo.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {actionInfo.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // --- Form Dialog Content (shared between create/edit) ---
  const renderFilterForm = (isEdit: boolean) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Loại bộ lọc</Label>
        <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTER_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                <div className="flex items-center gap-2">
                  <t.icon className="h-4 w-4" />
                  <span>{t.label}</span>
                  <span className="text-xs text-muted-foreground">- {t.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>
          {formData.type === 'keyword' && 'Từ khóa chặn'}
          {formData.type === 'url' && 'URL chặn (hoặc * để chặn tất cả URL)'}
          {formData.type === 'regex' && 'Regex pattern'}
          {formData.type === 'email' && 'Email hoặc domain (ví dụ: @spam.com)'}
        </Label>
        <Input
          value={formData.value}
          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
          placeholder={
            formData.type === 'keyword'
              ? 'Nhập từ khóa cần chặn...'
              : formData.type === 'url'
                ? 'example.com hoặc * để chặn tất cả URL'
                : formData.type === 'regex'
                  ? '\\b(spam|hack|cheat)\\b'
                  : '@spam.com'
          }
        />
        {formData.type === 'regex' && (
          <p className="text-xs text-muted-foreground">
            Sử dụng cú pháp regex JavaScript. Test trước khi lưu.
          </p>
        )}
        {formData.type === 'url' && (
          <p className="text-xs text-muted-foreground">
            Nhập <code className="bg-muted px-1 rounded">*</code> để chặn tất cả review chứa URL.
            Hoặc nhập domain cụ thể.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Hành động khi phát hiện</Label>
        <Select value={formData.action} onValueChange={(v) => setFormData({ ...formData, action: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTER_ACTIONS.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                <div className="flex items-center gap-2">
                  <a.icon className={`h-4 w-4 ${a.color}`} />
                  <span>{a.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Chặn hoàn toàn:</strong> Review bị từ chối, không được lưu.</p>
          <p><strong>Ẩn (cần duyệt):</strong> Review được lưu nhưng ẩn, cần admin duyệt.</p>
          <p><strong>Đánh dấu:</strong> Review vẫn hiển thị nhưng được đánh dấu để admin xem xét.</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Mô tả (tuỳ chọn)</Label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Ghi chú về bộ lọc này..."
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Kích hoạt</Label>
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng bộ lọc</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{stats.active} đang hoạt động</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Từ khóa</CardTitle>
            <Type className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.byType.keyword}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">URL</CardTitle>
            <Link2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.byType.url}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regex</CardTitle>
            <Code2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.byType.regex}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã chặn</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.totalMatches}</div>
            <p className="text-xs text-muted-foreground">lượt phát hiện</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="filters" className="space-y-4">
        <TabsList>
          <TabsTrigger value="filters">
            <Shield className="h-4 w-4 mr-2" />
            Danh sách bộ lọc
          </TabsTrigger>
          <TabsTrigger value="presets">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Preset có sẵn
          </TabsTrigger>
          <TabsTrigger value="test">
            <TestTube className="h-4 w-4 mr-2" />
            Kiểm tra bộ lọc
          </TabsTrigger>
          <TabsTrigger value="settings" onClick={() => fetchReviewSettings()}>
            <ToggleLeft className="h-4 w-4 mr-2" />
            Cài đặt
          </TabsTrigger>
        </TabsList>

        {/* Filters List Tab */}
        <TabsContent value="filters">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Quản lý bộ lọc Review</CardTitle>
                  <CardDescription>
                    Thiết lập các quy tắc tự động lọc review theo từ khóa, URL, regex hoặc email
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setBulkDialog(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Nhập hàng loạt
                  </Button>
                  <Button onClick={() => { resetForm(); setCreateDialog(true) }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm bộ lọc
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters toolbar */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm bộ lọc..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-40">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả loại</SelectItem>
                      <SelectItem value="keyword">Từ khóa</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                      <SelectItem value="regex">Regex</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-40">
                  <Select value={activeFilter} onValueChange={setActiveFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="true">Đang bật</SelectItem>
                      <SelectItem value="false">Đã tắt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filters Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Giá trị</TableHead>
                      <TableHead>Hành động</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Đã chặn</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10">
                          Đang tải...
                        </TableCell>
                      </TableRow>
                    ) : filters.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10">
                          <div className="flex flex-col items-center gap-2">
                            <ShieldOff className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">Chưa có bộ lọc nào</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { resetForm(); setCreateDialog(true) }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Thêm bộ lọc đầu tiên
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filters.map((filter) => (
                        <TableRow key={filter.id} className={!filter.isActive ? 'opacity-50' : ''}>
                          <TableCell>
                            <button
                              onClick={() => handleToggleActive(filter)}
                              className="hover:opacity-70 transition-opacity"
                              title={filter.isActive ? 'Nhấn để tắt' : 'Nhấn để bật'}
                            >
                              {filter.isActive ? (
                                <ToggleRight className="h-6 w-6 text-green-600" />
                              ) : (
                                <ToggleLeft className="h-6 w-6 text-gray-400" />
                              )}
                            </button>
                          </TableCell>
                          <TableCell>{getTypeBadge(filter.type)}</TableCell>
                          <TableCell>
                            <code className="bg-muted px-2 py-1 rounded text-sm max-w-[200px] truncate block">
                              {filter.value}
                            </code>
                          </TableCell>
                          <TableCell>{getActionBadge(filter.action)}</TableCell>
                          <TableCell className="max-w-[200px]">
                            <span className="text-sm text-muted-foreground truncate block">
                              {filter.description || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={filter.matchCount > 0 ? 'border-red-200 text-red-600' : ''}>
                              {filter.matchCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(filter.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(filter)}
                                title="Chỉnh sửa"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirm(filter.id)}
                                className="text-red-600 hover:text-red-700"
                                title="Xóa"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Hiển thị {((pagination.page - 1) * pagination.limit) + 1} đến{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                    >
                      Trước
                    </Button>
                    <span className="text-sm">
                      Trang {pagination.page} / {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                      disabled={pagination.page === pagination.pages}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Presets Tab */}
        <TabsContent value="presets">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-red-600" />
                  Chặn Spam
                </CardTitle>
                <CardDescription>
                  Từ khóa spam phổ biến: quảng cáo, link tải, hack, cheat...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-4">
                  {PRESET_KEYWORDS.spam.map((keyword) => (
                    <Badge key={keyword} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handlePresetImport('spam')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm {PRESET_KEYWORDS.spam.length} từ khóa
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Từ ngữ thô tục
                </CardTitle>
                <CardDescription>
                  Các từ ngữ không phù hợp, xúc phạm, vulgar...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-4">
                  {PRESET_KEYWORDS.offensive.map((keyword) => (
                    <Badge key={keyword} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handlePresetImport('offensive')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm {PRESET_KEYWORDS.offensive.length} từ khóa
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-purple-600" />
                  Chặn tất cả URL
                </CardTitle>
                <CardDescription>
                  Không cho phép review chứa bất kỳ URL/link nào
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Bộ lọc sẽ phát hiện và chặn tất cả các URL trong nội dung review,
                  bao gồm http://, https://, www., và các domain phổ biến.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handlePresetImport('urls')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Bật chặn URL
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Kiểm tra bộ lọc
              </CardTitle>
              <CardDescription>
                Nhập nội dung review mẫu để kiểm tra xem bộ lọc có phát hiện không
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tiêu đề review</Label>
                    <Input
                      value={testInput.title}
                      onChange={(e) => setTestInput({ ...testInput, title: e.target.value })}
                      placeholder="Nhập tiêu đề review..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nội dung review</Label>
                    <Textarea
                      value={testInput.content}
                      onChange={(e) => setTestInput({ ...testInput, content: e.target.value })}
                      placeholder="Nhập nội dung review để kiểm tra..."
                      rows={5}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tên khách (tuỳ chọn)</Label>
                      <Input
                        value={testInput.guestName}
                        onChange={(e) => setTestInput({ ...testInput, guestName: e.target.value })}
                        placeholder="Tên khách..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email khách (tuỳ chọn)</Label>
                      <Input
                        value={testInput.guestEmail}
                        onChange={(e) => setTestInput({ ...testInput, guestEmail: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                  <Button onClick={handleTest} disabled={testLoading} className="w-full">
                    <TestTube className="h-4 w-4 mr-2" />
                    {testLoading ? 'Đang kiểm tra...' : 'Kiểm tra'}
                  </Button>
                </div>

                <div>
                  <Label className="mb-2 block">Kết quả</Label>
                  {testResult === null ? (
                    <div className="border rounded-lg p-8 text-center text-muted-foreground">
                      <TestTube className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nhập nội dung và nhấn &quot;Kiểm tra&quot; để xem kết quả</p>
                    </div>
                  ) : testResult.matchedFilters.length === 0 ? (
                    <div className="border rounded-lg p-8 text-center border-green-200 bg-green-50">
                      <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <p className="font-medium text-green-800">Không phát hiện vi phạm</p>
                      <p className="text-sm text-green-600 mt-1">Review này sẽ được chấp nhận</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4 border-red-200 bg-red-50 space-y-3">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-6 w-6 text-red-600" />
                        <div>
                          <p className="font-medium text-red-800">
                            Phát hiện {testResult.matchedFilters.length} vi phạm
                          </p>
                          <p className="text-sm text-red-600">
                            Hành động: {getActionBadge(testResult.action)}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {testResult.matchedFilters.map((mf, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm bg-white p-2 rounded border">
                            {getTypeBadge(mf.type)}
                            <code className="bg-red-100 px-1 rounded">{mf.value}</code>
                            <span className="text-muted-foreground">→</span>
                            {getActionBadge(mf.action)}
                          </div>
                        ))}
                      </div>
                      {testResult.reason && (
                        <p className="text-xs text-red-600 border-t border-red-200 pt-2">
                          {testResult.reason}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ToggleLeft className="h-5 w-5" />
                Cài đặt duyệt Review
              </CardTitle>
              <CardDescription>
                Quản lý cài đặt chung cho việc kiểm duyệt review
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settingsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Đang tải cài đặt...</div>
              ) : (
                <>
                  {/* Require approval for ALL reviews */}
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-orange-500" />
                        <Label className="text-base font-medium">
                          Yêu cầu duyệt tất cả review mới
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Khi bật, tất cả review mới (kể cả thành viên đã đăng nhập) sẽ bị ẩn cho đến khi admin duyệt.
                        Review sẽ không hiển thị công khai cho đến khi được phê duyệt.
                      </p>
                    </div>
                    <Switch
                      checked={reviewSettings.requireApproval}
                      onCheckedChange={(checked) => updateReviewSetting('requireApproval', checked)}
                      disabled={settingsSaving}
                    />
                  </div>

                  {/* Require approval for guest reviews only */}
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <EyeOff className="h-5 w-5 text-yellow-500" />
                        <Label className="text-base font-medium">
                          Yêu cầu duyệt review từ khách (chưa đăng nhập)
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Khi bật, chỉ review từ khách vãng lai (chưa đăng nhập) mới cần duyệt.
                        Thành viên đã đăng nhập sẽ được hiển thị review ngay lập tức.
                        {reviewSettings.requireApproval && (
                          <span className="block mt-1 text-orange-500 font-medium">
                            ⚠️ Tùy chọn này không có tác dụng vì &quot;Duyệt tất cả review&quot; đang bật.
                          </span>
                        )}
                      </p>
                    </div>
                    <Switch
                      checked={reviewSettings.requireApprovalGuest}
                      onCheckedChange={(checked) => updateReviewSetting('requireApprovalGuest', checked)}
                      disabled={settingsSaving || reviewSettings.requireApproval}
                    />
                  </div>

                  {/* Status summary */}
                  <div className="rounded-lg bg-muted/50 p-4">
                    <h4 className="font-medium mb-2">Trạng thái hiện tại</h4>
                    <div className="space-y-1 text-sm">
                      {reviewSettings.requireApproval ? (
                        <p className="flex items-center gap-2 text-orange-600">
                          <ShieldAlert className="h-4 w-4" />
                          <strong>Chế độ kiểm duyệt đầy đủ:</strong> Tất cả review mới cần admin duyệt trước khi hiển thị.
                        </p>
                      ) : reviewSettings.requireApprovalGuest ? (
                        <p className="flex items-center gap-2 text-yellow-600">
                          <EyeOff className="h-4 w-4" />
                          <strong>Kiểm duyệt khách:</strong> Review từ khách cần duyệt, thành viên được hiển thị ngay.
                        </p>
                      ) : (
                        <p className="flex items-center gap-2 text-green-600">
                          <ShieldCheck className="h-4 w-4" />
                          <strong>Tự do:</strong> Review hiển thị ngay (trừ khi bị bộ lọc chặn/ẩn).
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Thêm bộ lọc mới
            </DialogTitle>
            <DialogDescription>
              Tạo quy tắc mới để tự động lọc review không phù hợp
            </DialogDescription>
          </DialogHeader>
          {renderFilterForm(false)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo bộ lọc
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Chỉnh sửa bộ lọc
            </DialogTitle>
            <DialogDescription>
              Cập nhật quy tắc lọc review
            </DialogDescription>
          </DialogHeader>
          {renderFilterForm(true)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdate}>
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Xác nhận xóa
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa bộ lọc này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={bulkDialog} onOpenChange={setBulkDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Nhập bộ lọc hàng loạt
            </DialogTitle>
            <DialogDescription>
              Nhập nhiều giá trị cùng lúc, mỗi dòng một giá trị
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại</Label>
                <Select value={bulkType} onValueChange={setBulkType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTER_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hành động</Label>
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTER_ACTIONS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Danh sách (mỗi dòng một giá trị)</Label>
              <Textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={'Nhập mỗi giá trị một dòng...\nVí dụ:\nspam\nhack\ncheat\nfree download'}
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                {bulkText.split('\n').filter((l) => l.trim()).length} giá trị sẽ được nhập
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleBulkImport} disabled={bulkLoading}>
              <Upload className="h-4 w-4 mr-2" />
              {bulkLoading ? 'Đang nhập...' : 'Nhập hàng loạt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

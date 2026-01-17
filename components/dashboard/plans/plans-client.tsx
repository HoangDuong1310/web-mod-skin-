'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  Plus,
  Edit,
  Trash2,
  Star,
  Zap,
  Loader2,
  Key,
  ShoppingCart,
} from 'lucide-react'

interface Plan {
  id: string
  name: string
  nameEn: string | null
  slug: string
  description: string | null
  descriptionEn: string | null
  price: number
  comparePrice: number | null
  priceUsd: number | null
  comparePriceUsd: number | null
  currency: string
  durationType: string
  durationValue: number
  features: string | null
  featuresEn: string | null
  maxDevices: number
  isActive: boolean
  isPopular: boolean
  isFeatured: boolean
  priority: number
  color: string | null
  createdAt: string
  deletedAt: string | null
  _count: {
    licenseKeys: number
    orders: number
  }
}

const durationLabels: Record<string, string> = {
  DAY: 'Ngày',
  WEEK: 'Tuần',
  MONTH: 'Tháng',
  QUARTER: 'Quý',
  YEAR: 'Năm',
  LIFETIME: 'Vĩnh viễn',
}

const defaultForm = {
  name: '',
  nameEn: '',
  slug: '',
  description: '',
  descriptionEn: '',
  price: 0,
  comparePrice: null as number | null,
  priceUsd: null as number | null,
  comparePriceUsd: null as number | null,
  currency: 'VND',
  durationType: 'MONTH',
  durationValue: 1,
  features: [] as string[],
  featuresEn: [] as string[],
  maxDevices: 1,
  isActive: true,
  isPopular: false,
  isFeatured: false,
  priority: 0,
  color: '',
}

export function PlansClient() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [featureInput, setFeatureInput] = useState('')
  const [featureEnInput, setFeatureEnInput] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/plans')
      const data = await res.json()
      
      if (data.success) {
        setPlans(data.data)
      }
    } catch (error) {
      toast.error('Không thể tải danh sách gói cước')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const openCreate = () => {
    setEditingPlan(null)
    setForm(defaultForm)
    setDialogOpen(true)
  }

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setForm({
      name: plan.name,
      nameEn: plan.nameEn || '',
      slug: plan.slug,
      description: plan.description || '',
      descriptionEn: plan.descriptionEn || '',
      price: Number(plan.price),
      comparePrice: plan.comparePrice ? Number(plan.comparePrice) : null,
      priceUsd: plan.priceUsd ? Number(plan.priceUsd) : null,
      comparePriceUsd: plan.comparePriceUsd ? Number(plan.comparePriceUsd) : null,
      currency: plan.currency,
      durationType: plan.durationType,
      durationValue: plan.durationValue,
      features: plan.features ? JSON.parse(plan.features) : [],
      featuresEn: plan.featuresEn ? JSON.parse(plan.featuresEn) : [],
      maxDevices: plan.maxDevices,
      isActive: plan.isActive,
      isPopular: plan.isPopular,
      isFeatured: plan.isFeatured,
      priority: plan.priority,
      color: plan.color || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.slug || form.price < 0) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }

    try {
      setSaving(true)
      const url = editingPlan
        ? `/api/admin/plans/${editingPlan.id}`
        : '/api/admin/plans'
      
      const res = await fetch(url, {
        method: editingPlan ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          comparePrice: form.comparePrice || undefined,
          priceUsd: form.priceUsd || undefined,
          comparePriceUsd: form.comparePriceUsd || undefined,
          nameEn: form.nameEn || undefined,
          descriptionEn: form.descriptionEn || undefined,
          featuresEn: form.featuresEn.length > 0 ? form.featuresEn : undefined,
          color: form.color || undefined,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(data.message)
        setDialogOpen(false)
        fetchPlans()
      } else {
        toast.error(data.message || 'Có lỗi xảy ra')
      }
    } catch (error) {
      toast.error('Không thể lưu gói cước')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (plan: Plan) => {
    if (!confirm(`Bạn có chắc muốn xóa gói "${plan.name}"?`)) return

    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (data.success) {
        toast.success(data.message)
        fetchPlans()
      } else {
        toast.error(data.message || 'Có lỗi xảy ra')
      }
    } catch (error) {
      toast.error('Không thể xóa gói cước')
    }
  }

  const addFeature = () => {
    if (featureInput.trim()) {
      setForm({
        ...form,
        features: [...form.features, featureInput.trim()],
      })
      setFeatureInput('')
    }
  }

  const addFeatureEn = () => {
    if (featureEnInput.trim()) {
      setForm({
        ...form,
        featuresEn: [...form.featuresEn, featureEnInput.trim()],
      })
      setFeatureEnInput('')
    }
  }

  const removeFeature = (index: number) => {
    setForm({
      ...form,
      features: form.features.filter((_, i) => i !== index),
    })
  }

  const removeFeatureEn = (index: number) => {
    setForm({
      ...form,
      featuresEn: form.featuresEn.filter((_, i) => i !== index),
    })
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency,
    }).format(price)
  }

  const formatDuration = (type: string, value: number) => {
    if (type === 'LIFETIME') return 'Vĩnh viễn'
    return `${value} ${durationLabels[type]}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm gói cước
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${!plan.isActive ? 'opacity-60' : ''}`}>
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary">
                  <Star className="h-3 w-3 mr-1" />
                  Phổ biến
                </Badge>
              </div>
            )}
            {plan.isFeatured && !plan.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="secondary">
                  <Zap className="h-3 w-3 mr-1" />
                  Nổi bật
                </Badge>
              </div>
            )}
            
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{formatDuration(plan.durationType, plan.durationValue)}</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(plan)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(plan)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    {formatPrice(Number(plan.price), 'VND')}
                  </span>
                  {plan.comparePrice && (
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(Number(plan.comparePrice), 'VND')}
                    </span>
                  )}
                </div>
                {plan.priceUsd && (
                  <div className="flex items-baseline gap-2 mt-1 text-sm text-muted-foreground">
                    <span className="font-medium">
                      {formatPrice(Number(plan.priceUsd), 'USD')}
                    </span>
                    {plan.comparePriceUsd && (
                      <span className="line-through">
                        {formatPrice(Number(plan.comparePriceUsd), 'USD')}
                      </span>
                    )}
                    <Badge variant="outline" className="text-xs">USD</Badge>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Key className="h-4 w-4" />
                  <span>{plan._count.licenseKeys} keys</span>
                </div>
                <div className="flex items-center gap-1">
                  <ShoppingCart className="h-4 w-4" />
                  <span>{plan._count.orders} orders</span>
                </div>
              </div>
              
              <div className="text-sm">
                <span className="text-muted-foreground">Tối đa: </span>
                <span>{plan.maxDevices} thiết bị</span>
              </div>
              
              {plan.features && (
                <ul className="text-sm space-y-1">
                  {JSON.parse(plan.features).slice(0, 3).map((feature: string, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      {feature}
                    </li>
                  ))}
                  {JSON.parse(plan.features).length > 3 && (
                    <li className="text-muted-foreground">
                      +{JSON.parse(plan.features).length - 3} tính năng khác
                    </li>
                  )}
                </ul>
              )}
              
              <div className="flex gap-2">
                {!plan.isActive && <Badge variant="secondary">Tắt</Badge>}
                {plan.deletedAt && <Badge variant="destructive">Đã xóa</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Chưa có gói cước nào. Hãy tạo gói cước đầu tiên!
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Chỉnh sửa gói cước' : 'Tạo gói cước mới'}</DialogTitle>
            <DialogDescription>
              {editingPlan ? 'Cập nhật thông tin gói cước' : 'Điền thông tin để tạo gói cước mới'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Basic Info */}
            <div className="p-4 border rounded-lg space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Thông tin cơ bản</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tên gói (VN) *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="VD: 1 Tháng, 1 Năm..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tên gói (EN)</Label>
                  <Input
                    value={form.nameEn}
                    onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                    placeholder="1 Month, 1 Year..."
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="1-thang, 1-nam..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mô tả (VN)</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Mô tả ngắn về gói cước..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mô tả (EN)</Label>
                  <Textarea
                    value={form.descriptionEn}
                    onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
                    placeholder="Short description..."
                  />
                </div>
              </div>
            </div>

            {/* Pricing VND */}
            <div className="p-4 border rounded-lg space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">💰 Giá VND (cho người Việt)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Giá VND *</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                    placeholder="150000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Giá gốc VND (tùy chọn)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.comparePrice || ''}
                    onChange={(e) => setForm({ ...form, comparePrice: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="200000"
                  />
                </div>
              </div>
            </div>

            {/* Pricing USD */}
            <div className="p-4 border rounded-lg space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">💵 Giá USD (cho người nước ngoài)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Giá USD</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.priceUsd || ''}
                    onChange={(e) => setForm({ ...form, priceUsd: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="7.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Giá gốc USD (tùy chọn)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.comparePriceUsd || ''}
                    onChange={(e) => setForm({ ...form, comparePriceUsd: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="10.00"
                  />
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Loại thời hạn *</Label>
                <Select
                  value={form.durationType}
                  onValueChange={(v) => setForm({ ...form, durationType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAY">Ngày</SelectItem>
                    <SelectItem value="WEEK">Tuần</SelectItem>
                    <SelectItem value="MONTH">Tháng</SelectItem>
                    <SelectItem value="QUARTER">Quý</SelectItem>
                    <SelectItem value="YEAR">Năm</SelectItem>
                    <SelectItem value="LIFETIME">Vĩnh viễn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Số lượng</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.durationValue}
                  onChange={(e) => setForm({ ...form, durationValue: parseInt(e.target.value) || 1 })}
                  disabled={form.durationType === 'LIFETIME'}
                />
              </div>
              <div className="space-y-2">
                <Label>Max thiết bị</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.maxDevices}
                  onChange={(e) => setForm({ ...form, maxDevices: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            {/* Features VN */}
            <div className="p-4 border rounded-lg space-y-2">
              <Label>Tính năng (VN)</Label>
              <div className="flex gap-2">
                <Input
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  placeholder="Nhập tính năng và nhấn Thêm"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                />
                <Button type="button" variant="outline" onClick={addFeature}>
                  Thêm
                </Button>
              </div>
              {form.features.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {form.features.map((feature, i) => (
                    <li key={i} className="flex items-center justify-between text-sm bg-muted px-3 py-1 rounded">
                      <span>{feature}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removeFeature(i)}
                      >
                        ×
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Features EN */}
            <div className="p-4 border rounded-lg space-y-2">
              <Label>Tính năng (EN)</Label>
              <div className="flex gap-2">
                <Input
                  value={featureEnInput}
                  onChange={(e) => setFeatureEnInput(e.target.value)}
                  placeholder="Enter feature and click Add"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeatureEn())}
                />
                <Button type="button" variant="outline" onClick={addFeatureEn}>
                  Add
                </Button>
              </div>
              {form.featuresEn.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {form.featuresEn.map((feature, i) => (
                    <li key={i} className="flex items-center justify-between text-sm bg-muted px-3 py-1 rounded">
                      <span>{feature}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removeFeatureEn(i)}
                      >
                        ×
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Độ ưu tiên</Label>
                <Input
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                  placeholder="Số lớn hơn hiển thị trước"
                />
              </div>
              <div className="space-y-2">
                <Label>Màu (hex)</Label>
                <Input
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
                <Label>Kích hoạt</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isPopular}
                  onCheckedChange={(v) => setForm({ ...form, isPopular: v })}
                />
                <Label>Phổ biến</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isFeatured}
                  onCheckedChange={(v) => setForm({ ...form, isFeatured: v })}
                />
                <Label>Nổi bật</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingPlan ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

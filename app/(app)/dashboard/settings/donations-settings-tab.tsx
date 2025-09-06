'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

type BanksMap = Record<string, { id: string; name: string }>

export function DonationsSettingsTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [availableBanks, setAvailableBanks] = useState<BanksMap>({})

  const [form, setForm] = useState({
    // Ko-fi
    kofiEnabled: false,
    kofiUsername: '',
    kofiWebhookToken: '',
    kofiButtonColor: 'FF5F5F',
    kofiDefaultMessage: '',
    // VietQR
    vietqrEnabled: false,
    vietqrBankId: '',
    vietqrAccountNo: '',
    vietqrAccountName: '',
    vietqrTemplate: 'compact2',
    // General
    usdToVndRate: 27000,
  })

  const bankOptions = useMemo(() => {
    return Object.entries(availableBanks).map(([key, v]) => ({ value: v.id, label: v.name }))
  }, [availableBanks])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/admin/donation-settings')
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        const s = data.settings || {}
        setAvailableBanks(data.availableBanks || {})
        setForm(prev => ({
          ...prev,
          kofiEnabled: !!s.kofiEnabled,
          kofiUsername: s.kofiUsername || '',
          kofiWebhookToken: s.kofiWebhookToken || '',
          kofiButtonColor: s.kofiButtonColor || 'FF5F5F',
          kofiDefaultMessage: s.kofiDefaultMessage || '',
          vietqrEnabled: !!s.vietqrEnabled,
          vietqrBankId: s.vietqrBankId || '',
          vietqrAccountNo: s.vietqrAccountNo || '',
          vietqrAccountName: s.vietqrAccountName || '',
          vietqrTemplate: s.vietqrTemplate || 'compact2',
          usdToVndRate: Number(s.usdToVndRate || 27000),
        }))
      } catch (e) {
        setError('Không tải được cấu hình hiện tại')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const save = async () => {
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      // Basic client validation aligned with server
      if (form.kofiEnabled && !form.kofiUsername) {
        setError('Cần nhập Ko‑fi username khi bật Ko‑fi')
        setSaving(false)
        return
      }
      if (form.vietqrEnabled && (!form.vietqrBankId || !form.vietqrAccountNo || !form.vietqrAccountName)) {
        setError('Cần điền đủ ngân hàng/số TK/tên TK khi bật VietQR')
        setSaving(false)
        return
      }

      const res = await fetch('/api/admin/donation-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Send only fields expected by API schema
          kofiEnabled: form.kofiEnabled,
          kofiUsername: form.kofiUsername || undefined,
          kofiWebhookToken: form.kofiWebhookToken || undefined,
          kofiButtonColor: form.kofiButtonColor || 'FF5F5F',
          kofiDefaultMessage: form.kofiDefaultMessage || undefined,
          vietqrEnabled: form.vietqrEnabled,
          vietqrBankId: form.vietqrBankId || undefined,
          vietqrAccountNo: form.vietqrAccountNo || undefined,
          vietqrAccountName: form.vietqrAccountName || undefined,
          vietqrTemplate: form.vietqrTemplate || 'compact2',
          donationsEnabled: true,
          manualDonationsEnabled: false,
          usdToVndRate: Number(form.usdToVndRate) || 27000,
          showDonationGoal: true,
          showRecentDonations: true,
          maxRecentDonations: 10,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Lưu thất bại')
      }

      setSuccess('Đã lưu cấu hình quyên góp')
    } catch (e: any) {
      setError(e.message || 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6">
      {error && (
        <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
      )}
      {success && (
        <Alert><AlertDescription>{success}</AlertDescription></Alert>
      )}

      {/* Ko-fi */}
      <Card>
        <CardHeader>
          <CardTitle>Ko‑fi</CardTitle>
          <CardDescription>Cấu hình thanh toán qua Ko‑fi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Bật Ko‑fi</Label>
            </div>
            <Switch checked={form.kofiEnabled} onCheckedChange={v => setForm(f => ({ ...f, kofiEnabled: v }))} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="kofiUsername">Ko‑fi Username</Label>
              <Input id="kofiUsername" value={form.kofiUsername} onChange={e => setForm(f => ({ ...f, kofiUsername: e.target.value }))} placeholder="your_kofi_username" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kofiWebhookToken">Webhook Token (env)</Label>
              <Input id="kofiWebhookToken" value={form.kofiWebhookToken} onChange={e => setForm(f => ({ ...f, kofiWebhookToken: e.target.value }))} placeholder="Khuyến nghị đặt trong ENV" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="kofiButtonColor">Màu nút</Label>
              <Input id="kofiButtonColor" value={form.kofiButtonColor} onChange={e => setForm(f => ({ ...f, kofiButtonColor: e.target.value }))} placeholder="FF5F5F" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kofiDefaultMessage">Lời nhắn mặc định</Label>
              <Input id="kofiDefaultMessage" value={form.kofiDefaultMessage} onChange={e => setForm(f => ({ ...f, kofiDefaultMessage: e.target.value }))} placeholder="Cảm ơn bạn đã ủng hộ!" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VietQR */}
      <Card>
        <CardHeader>
          <CardTitle>VietQR</CardTitle>
          <CardDescription>Cấu hình chuyển khoản qua mã QR</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Bật VietQR</Label>
            </div>
            <Switch checked={form.vietqrEnabled} onCheckedChange={v => setForm(f => ({ ...f, vietqrEnabled: v }))} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Ngân hàng</Label>
              <Select value={form.vietqrBankId} onValueChange={v => setForm(f => ({ ...f, vietqrBankId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ngân hàng" />
                </SelectTrigger>
                <SelectContent>
                  {bankOptions.map(b => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vietqrBankId">Bank ID (mã VietQR)</Label>
              <Input id="vietqrBankId" value={form.vietqrBankId} onChange={e => setForm(f => ({ ...f, vietqrBankId: e.target.value }))} placeholder="VD: 970415 (VietinBank)" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vietqrAccountNo">Số tài khoản</Label>
              <Input id="vietqrAccountNo" value={form.vietqrAccountNo} onChange={e => setForm(f => ({ ...f, vietqrAccountNo: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vietqrAccountName">Tên tài khoản</Label>
              <Input id="vietqrAccountName" value={form.vietqrAccountName} onChange={e => setForm(f => ({ ...f, vietqrAccountName: e.target.value }))} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Template QR</Label>
              <Select value={form.vietqrTemplate} onValueChange={v => setForm(f => ({ ...f, vietqrTemplate: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="compact2">Compact 2</SelectItem>
                  <SelectItem value="qr_only">QR Only</SelectItem>
                  <SelectItem value="print">Print</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="usdToVndRate">Tỷ giá USD→VND</Label>
              <Input id="usdToVndRate" type="number" min="1000" step="1" value={form.usdToVndRate} onChange={e => setForm(f => ({ ...f, usdToVndRate: Number(e.target.value) }))} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving || loading}>{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</Button>
      </div>
    </div>
  )
}

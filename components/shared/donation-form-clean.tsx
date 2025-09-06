'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { convertUSDToVND, formatVND, generateVietQRUrl, VIETNAM_BANKS } from '@/lib/vietqr'
import { generateKofiButtonEmbed } from '@/lib/kofi'

// Types
interface DonationGoal {
  id: string
  title: string
  currency: string
}

interface DonationSettings {
  kofiEnabled: boolean
  kofiUsername?: string
  vietqrEnabled: boolean
  vietqrBankId?: string
  vietqrAccountNo?: string
  vietqrAccountName?: string
  usdToVndRate: number
}

interface DonationFormCleanProps {
  goal?: DonationGoal | null
  onSuccess?: () => void
  onCancel?: () => void
}

// Preset amounts in USD for donations
const PRESET_AMOUNTS = [5, 10, 25, 50, 100]

type PaymentMethod = 'KOFI' | 'BANK_TRANSFER' | ''

export default function DonationFormClean({ goal, onSuccess, onCancel }: DonationFormCleanProps) {
  const { data: session } = useSession()

  const [settings, setSettings] = useState<DonationSettings>({
    kofiEnabled: false,
    vietqrEnabled: false,
    usdToVndRate: 27000,
  })

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('')
  const [amount, setAmount] = useState('') // preset selected stored here as string
  const [customAmount, setCustomAmount] = useState('')
  const [message, setMessage] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // VietQR UI state
  const [qrUrl, setQrUrl] = useState<string>('')
  const [qrAddInfo, setQrAddInfo] = useState<string>('')
  const [qrVndAmount, setQrVndAmount] = useState<number>(0)
  const bankName = useMemo(() => {
    const id = settings.vietqrBankId
    if (!id) return ''
    const entry = Object.values(VIETNAM_BANKS).find((b) => b.id === id)
    return entry?.name || id
  }, [settings.vietqrBankId])

  // Fetch settings
  const [settingsLoading, setSettingsLoading] = useState(true)
  useEffect(() => {
    let mounted = true
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/donations/settings')
        const data = res.ok ? await res.json() : null
        if (!mounted || !data) return

        const cfg: DonationSettings = {
          kofiEnabled: data.settings.kofiEnabled || false,
          kofiUsername: data.settings.kofiUsername,
          vietqrEnabled: data.settings.vietqrEnabled || false,
          vietqrBankId: data.settings.vietqrBankId,
          vietqrAccountNo: data.settings.vietqrAccountNo,
          vietqrAccountName: data.settings.vietqrAccountName,
          usdToVndRate: data.settings.usdToVndRate || 27000,
        }
        setSettings(cfg)
        // Do not auto-select method; user must choose first
      } catch {
        // silent
      } finally {
        if (mounted) setSettingsLoading(false)
      }
    }
    fetchSettings()
    return () => {
      mounted = false
    }
  }, [])

  // Amounts (USD for donation, VND for QR display)
  const finalUsdAmount = useMemo(() => {
    if (customAmount) return Math.max(0, parseFloat(customAmount)) || 0
    if (amount) return Math.max(0, parseFloat(amount)) || 0
    return 0
  }, [amount, customAmount])

  const finalVndAmount = useMemo(() => {
    if (finalUsdAmount <= 0) return 0
    return convertUSDToVND(finalUsdAmount, settings.usdToVndRate)
  }, [finalUsdAmount, settings.usdToVndRate])

  // Build VietQR addInfo from current inputs (just the message)
  const currentAddInfo = useMemo(() => {
    return message.trim() || 'Ủng hộ dự án'
  }, [message])

  // Live-generate QR whenever relevant state changes
  useEffect(() => {
    if (paymentMethod !== 'BANK_TRANSFER') {
      setQrUrl('')
      setQrAddInfo('')
      setQrVndAmount(0)
      return
    }

    // Simple QR generation like the sample: just need bankId, accountNo, template
    // Use fallback values if settings not fully configured
    const bankId = settings.vietqrBankId || 'vietinbank'
    const accountNo = settings.vietqrAccountNo || '113366668888'
    const accountName = settings.vietqrAccountName || 'WebModSkin Donation'
    
    // Build simple QR URL
    const params = new URLSearchParams()
    if (finalVndAmount > 0) {
      params.append('amount', String(finalVndAmount))
    }
    params.append('addInfo', currentAddInfo || 'Donation')
    params.append('accountName', accountName)
    
    const url = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.jpg?${params.toString()}`
    
    setQrUrl(url)
    setQrAddInfo(currentAddInfo)
    setQrVndAmount(finalVndAmount)
  }, [paymentMethod, settings, finalVndAmount, currentAddInfo])

  // Handlers
  const handlePreset = (amt: number) => {
    setAmount(String(amt))
    setCustomAmount('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation() // Add this to prevent event bubbling
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (paymentMethod === 'KOFI') {
        if (!settings.kofiEnabled || !settings.kofiUsername) {
          setError('Ko‑fi hiện không khả dụng')
          return
        }
        // No-op: with embed flow, we do not auto-open a new tab.
        setSuccess('Bạn có thể bấm nút Ko‑fi phía trên để ủng hộ.')
        return
      }

      // BANK_TRANSFER: Create donation record and redirect to thank you page
      if (paymentMethod === 'BANK_TRANSFER') {
        if (!finalUsdAmount || finalUsdAmount <= 0) {
          setError('Vui lòng nhập số tiền hợp lệ')
          setLoading(false)
          return
        }

        const donationData = {
          amount: finalUsdAmount, // Save in USD
          currency: 'USD', // Save as USD
          paymentMethod: 'BANK_TRANSFER',
          donorName: session?.user?.name || 'Anonymous',
          donorEmail: session?.user?.email || '',
          message: message || '',
          isAnonymous: false,
          goalId: goal?.id,
          // Include QR info for reference
          qrUrl: qrUrl,
          transferNote: currentAddInfo
        }

        const response = await fetch('/api/donations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(donationData)
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Không thể tạo donation')
        }
        
        // Direct redirect to thank you page
        window.location.href = '/donate/thank-you'
        return
      }
    } catch (error: any) {
      setError(error.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  const kofiAvailable = settings.kofiEnabled && !!settings.kofiUsername
  const bankAvailable = true // QR always available with fallback values

  // Ko-fi inline embed HTML
  const kofiEmbedHtml = useMemo(() => {
    if (!kofiAvailable) return ''
    return generateKofiButtonEmbed(settings.kofiUsername!, {
      // Do not pass amount to avoid currency confusion; Ko‑fi handles its own currency
      text: 'Donate',
    })
  }, [kofiAvailable, settings.kofiUsername])

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Ủng hộ dự án</h2>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Quay lại</Button>
        )}
      </div>

      {error && (
        <Alert>
          <AlertDescription className="text-red-600">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Payment method */}
      <Card>
        <CardHeader>
          <CardTitle>Phương thức thanh toán</CardTitle>
          <CardDescription>Chọn một phương thức để tiếp tục</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
      <RadioGroup
            value={paymentMethod}
            onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
            className="space-y-2"
          >
            <label
              className={`flex items-start gap-3 rounded-md border p-3 transition-colors ${
                paymentMethod === 'KOFI' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
        } cursor-pointer`}
            >
        <RadioGroupItem value="KOFI" id="kofi" className="mt-0.5" />
              <div>
                <div className="font-medium">Ko‑fi</div>
                <p className="text-sm text-gray-600">Thanh toán bằng thẻ hoặc PayPal.</p>
                {!kofiAvailable && !settingsLoading && (
          <p className="text-xs text-gray-500 mt-1">Chưa cấu hình – sẽ không thể thanh toán cho đến khi cấu hình xong.</p>
                )}
              </div>
            </label>

            <label
              className={`flex items-start gap-3 rounded-md border p-3 transition-colors ${
                paymentMethod === 'BANK_TRANSFER' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
        } cursor-pointer`}
            >
        <RadioGroupItem value="BANK_TRANSFER" id="bank" className="mt-0.5" />
              <div>
                <div className="font-medium">Chuyển khoản ngân hàng (VietQR)</div>
                <p className="text-sm text-gray-600">Quét mã QR với app ngân hàng.</p>
                {!bankAvailable && !settingsLoading && (
          <p className="text-xs text-gray-500 mt-1">QR sẽ dùng thông tin mặc định nếu chưa cấu hình.</p>
                )}
              </div>
            </label>
          </RadioGroup>
        </CardContent>
      </Card>

  {/* Chỉ hiển thị nhập số tiền cho chuyển khoản ngân hàng */}
  {paymentMethod === 'BANK_TRANSFER' && (
        <Card>
          <CardHeader>
            <CardTitle>Số tiền ủng hộ</CardTitle>
            <CardDescription>Chọn nhanh hoặc nhập số tiền (USD)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handlePreset(amt)}
                  className={`h-10 rounded-md border text-sm font-medium transition-colors ${amount === String(amt) ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customAmount">Hoặc nhập số tiền khác</Label>
              <Input
                id="customAmount"
                type="number"
                step="0.01"
                min="1"
                placeholder="Ví dụ: 5"
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); setAmount('') }}
              />
              {paymentMethod === 'BANK_TRANSFER' && finalUsdAmount > 0 && (
                <p className="text-sm text-gray-600">Tương đương: {formatVND(finalVndAmount)} (QR sẽ hiển thị số tiền VND này)</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

  {/* Bỏ ẩn danh và thông tin người ủng hộ theo yêu cầu */}

      {/* Conditional fields per method */}
  {paymentMethod === 'KOFI' && (
        <Card>
          <CardHeader>
            <CardTitle>Ủng hộ qua Ko‑fi</CardTitle>
            <CardDescription>Bấm nút bên dưới để mở Ko‑fi</CardDescription>
          </CardHeader>
          <CardContent>
            {kofiAvailable ? (
              <div dangerouslySetInnerHTML={{ __html: kofiEmbedHtml }} />
            ) : (
              <p className="text-sm text-gray-500">Ko‑fi chưa cấu hình.</p>
            )}
          </CardContent>
        </Card>
      )}

  {paymentMethod === 'BANK_TRANSFER' && (
        <Card>
          <CardHeader>
            <CardTitle>Thông tin chuyển khoản</CardTitle>
            <CardDescription>Điền lời nhắn để tạo nội dung chuyển khoản phù hợp</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bankMessage">Lời nhắn</Label>
              <Input
                id="bankMessage"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ví dụ: Ủng hộ dự án"
              />
              {qrAddInfo && (
                <p className="text-xs text-gray-500">Nội dung chuyển khoản: {qrAddInfo}</p>
              )}
            </div>

            {/* Live QR */}
            {qrUrl && (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <img src={qrUrl} alt="QR Code chuyển khoản" className="w-64 h-64 rounded-md border" />
                </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md border p-3">
                    <div className="text-gray-500">Ngân hàng</div>
          <div className="font-medium">{bankName}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-gray-500">Số tài khoản</div>
                    <div className="font-mono">{settings.vietqrAccountNo}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-gray-500">Tên tài khoản</div>
                    <div className="font-medium">{settings.vietqrAccountName}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-gray-500">Số tiền</div>
                    <div className="font-medium text-green-700">{qrVndAmount.toLocaleString()} VNĐ</div>
                  </div>
                </div>
              </div>
            )}

            {!qrUrl && (
              <p className="text-sm text-gray-600">QR sẽ hiển thị khi chọn Bank Transfer.</p>
            )}
          </CardContent>
        </Card>
      )}

      {paymentMethod === 'BANK_TRANSFER' && (
        <div>
          <Button type="submit" className="w-full" disabled={loading || !bankAvailable || !finalUsdAmount}>
            Xác nhận
          </Button>
        </div>
      )}
    </form>
  )
}

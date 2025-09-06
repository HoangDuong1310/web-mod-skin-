'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Heart, ArrowLeft, Loader2, Coffee, CreditCard, Building2, QrCode, Copy, ExternalLink, DollarSign, Sparkles, Star } from 'lucide-react'
import { convertUSDToVND, formatVND, formatUSD, VIETNAM_BANKS } from '@/lib/vietqr'
import { generateKofiLink } from '@/lib/kofi'

interface DonationGoal {
  id: string
  title: string
  currency: string
}

interface DonationFormProps {
  goal?: DonationGoal | null
  onSuccess: () => void
  onCancel: () => void
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

const PRESET_AMOUNTS = [5, 10, 25, 50, 100]

export function DonationForm({ goal, onSuccess, onCancel }: DonationFormProps) {
  const { data: session } = useSession()
  const [settings, setSettings] = useState<DonationSettings>({
    kofiEnabled: false,
    vietqrEnabled: false,
    usdToVndRate: 27000
  })
  const [formData, setFormData] = useState({
    amount: '',
    customAmount: '',
    isAnonymous: false,
    donorName: session?.user?.name || '',
    donorEmail: session?.user?.email || '',
    message: '',
    isMessagePublic: true,
    paymentMethod: 'KOFI' // Default to Ko-fi
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [qrData, setQrData] = useState<any>(null)
  const [processingStep, setProcessingStep] = useState('')

  // Fetch donation settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/donation-settings')
        if (response.ok) {
          const data = await response.json()
          setSettings({
            kofiEnabled: data.settings.kofiEnabled || false,
            kofiUsername: data.settings.kofiUsername,
            vietqrEnabled: data.settings.vietqrEnabled || false,
            vietqrBankId: data.settings.vietqrBankId,
            vietqrAccountNo: data.settings.vietqrAccountNo,
            vietqrAccountName: data.settings.vietqrAccountName,
            usdToVndRate: data.settings.usdToVndRate || 27000
          })
        }
      } catch (error) {
        console.error('Failed to fetch donation settings:', error)
      }
    }
    fetchSettings()
  }, [])

  const handleAmountSelect = (amount: number) => {
    setFormData(prev => ({
      ...prev,
      amount: amount.toString(),
      customAmount: ''
    }))
  }

  const handleCustomAmountChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      customAmount: value,
      amount: ''
    }))
  }

  const getFinalAmount = () => {
    if (formData.customAmount) {
      return parseFloat(formData.customAmount)
    }
    if (formData.amount) {
      return parseFloat(formData.amount)
    }
    return 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setQrData(null)

    const finalAmount = getFinalAmount()
    
    if (!finalAmount || finalAmount <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ')
      return
    }

    if (formData.isAnonymous && !formData.donorName.trim()) {
      setError('Vui lòng nhập tên của bạn')
      return
    }

    setLoading(true)

    try {
      // Handle Ko-fi donation
      if (formData.paymentMethod === 'KOFI') {
        if (!settings.kofiEnabled || !settings.kofiUsername) {
          throw new Error('Ko-fi không khả dụng')
        }

        setProcessingStep('Đang chuyển hướng đến Ko-fi...')
        
        const kofiUrl = generateKofiLink(settings.kofiUsername, {
          amount: finalAmount,
          message: formData.message || `Donation${goal ? ` for ${goal.title}` : ''}`
        })

        // Open Ko-fi in new window
        window.open(kofiUrl, '_blank')
        
        setSuccess('Đã mở Ko-fi trong tab mới. Donation sẽ được tự động ghi nhận sau khi thanh toán.')
        setTimeout(() => onSuccess(), 3000)
        return
      }

      // Handle VietQR bank transfer
      if (formData.paymentMethod === 'BANK_TRANSFER') {
        if (!settings.vietqrEnabled || !settings.vietqrBankId || !settings.vietqrAccountNo) {
          throw new Error('Chuyển khoản ngân hàng không khả dụng')
        }

        setProcessingStep('Đang tạo mã QR...')

        const donationData = {
          amount: finalAmount,
          currency: 'USD',
          paymentMethod: 'BANK_TRANSFER',
          donorName: formData.isAnonymous ? formData.donorName : (session?.user?.name || formData.donorName),
          donorEmail: formData.isAnonymous ? formData.donorEmail : (session?.user?.email || formData.donorEmail),
          message: formData.message,
          isAnonymous: formData.isAnonymous,
          goalId: goal?.id,
          bankConfig: {
            bankId: settings.vietqrBankId,
            accountNo: settings.vietqrAccountNo,
            accountName: settings.vietqrAccountName || 'WebModSkin Donation'
          }
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

        setQrData(result.qrData)
        setSuccess('Mã QR đã được tạo! Vui lòng quét mã để chuyển khoản.')
        return
      }

      // Handle manual donation (for admin)
      if (formData.paymentMethod === 'MANUAL') {
        setProcessingStep('Đang tạo donation...')

        const donationData = {
          amount: finalAmount,
          currency: goal?.currency || 'USD',
          paymentMethod: 'MANUAL',
          donorName: formData.isAnonymous ? formData.donorName : (session?.user?.name || formData.donorName),
          donorEmail: formData.isAnonymous ? formData.donorEmail : (session?.user?.email || formData.donorEmail),
          message: formData.message,
          isAnonymous: formData.isAnonymous,
          goalId: goal?.id
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

        setSuccess('Donation đã được tạo thành công!')
        setTimeout(() => onSuccess(), 2000)
        return
      }

    } catch (error) {
      console.error('Error creating donation:', error)
      setError(error instanceof Error ? error.message : 'Không thể tạo donation')
    } finally {
      setLoading(false)
      setProcessingStep('')
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Hero Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-4 shadow-2xl">
              <Heart className="h-12 w-12 text-white animate-pulse" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-6 mb-2">
            Ủng hộ dự án
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Mỗi sự ủng hộ của bạn là động lực để chúng mình tiếp tục phát triển và mang đến những sản phẩm tốt nhất 💖
          </p>
          {goal && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-6 py-2 shadow-lg border">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">{goal.title}</span>
            </div>
          )}
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tổng ủng hộ</p>
                <p className="text-2xl font-bold text-green-600">$2,340</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Người ủng hộ</p>
                <p className="text-2xl font-bold text-blue-600">47</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/20 rounded-full p-3">
                <Heart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Mục tiêu</p>
                <p className="text-2xl font-bold text-purple-600">$5,000</p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/20 rounded-full p-3">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tiến độ</span>
            <span className="text-sm font-medium text-blue-600">47%</span>
          </div>
          <div className="relative">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg" 
                   style={{ width: '47%' }}></div>
            </div>
            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-400/20 to-purple-600/20 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={loading}
                className="rounded-full hover:bg-white/20 text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1 text-white">
                <h3 className="text-xl font-bold">Chọn mức ủng hộ</h3>
                <p className="text-blue-100 text-sm">Mọi sự đóng góp đều có ý nghĩa</p>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 m-6 rounded-r-lg">
              <div className="flex items-center">
                <div className="text-red-500 mr-3 text-lg">⚠️</div>
                <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 m-6 rounded-r-lg">
              <div className="flex items-center">
                <div className="text-green-500 mr-3 text-lg">✅</div>
                <p className="text-green-700 dark:text-green-300 font-medium">{success}</p>
              </div>
            </div>
          )}

          {/* Processing Step */}
          {loading && processingStep && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 m-6 rounded-r-lg">
              <div className="flex items-center">
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-3" />
                <p className="text-blue-700 dark:text-blue-300 font-medium">{processingStep}</p>
              </div>
            </div>
          )}

          {/* QR Code Display for Bank Transfer */}
          {qrData && (
            <div className="m-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl p-8 border border-blue-200 dark:border-blue-700">
              <div className="text-center">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full p-4 w-20 h-20 mx-auto mb-6 shadow-2xl">
                  <QrCode className="h-12 w-12 text-white" />
                </div>
                <h4 className="font-bold text-2xl mb-3 text-blue-900 dark:text-blue-100">
                  Quét mã QR để chuyển khoản
                </h4>
                <p className="text-blue-700 dark:text-blue-300 mb-8 text-lg">
                  Sử dụng app ngân hàng để quét mã QR bên dưới
                </p>
              </div>
              
              <div className="text-center mb-8">
                <div className="bg-white rounded-3xl p-6 inline-block shadow-2xl border-4 border-blue-100">
                  <img 
                    src={qrData.qrUrl} 
                    alt="VietQR Code" 
                    className="mx-auto rounded-2xl"
                    style={{ maxWidth: '300px' }}
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <h5 className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <span className="text-xl">📋</span> Thông tin chuyển khoản
                </h5>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <span>🏦</span> Ngân hàng:
                    </span>
                    <span className="font-bold text-lg">{qrData.displayInfo.bankName}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <span>💳</span> Số TK:
                    </span>
                    <span className="font-mono font-bold text-lg">{qrData.displayInfo.accountNo}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <span>👤</span> Tên TK:
                    </span>
                    <span className="font-bold text-lg">{qrData.displayInfo.accountName}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <span>💰</span> Số tiền:
                    </span>
                    <span className="font-bold text-xl text-blue-600 dark:text-blue-400">
                      {qrData.displayInfo.vndAmount} ({qrData.displayInfo.usdAmount})
                    </span>
                  </div>
                  <div className="flex justify-between items-start py-3">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <span>💬</span> Nội dung:
                    </span>
                    <span className="font-mono text-sm text-right max-w-[250px] bg-gray-100 dark:bg-gray-700 p-2 rounded">{qrData.transferNote}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-4 mt-6 border border-yellow-200 dark:border-yellow-700">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center font-medium">
                  💡 Sau khi chuyển khoản thành công, donation sẽ được xác nhận tự động trong vòng 2-5 phút
                </p>
              </div>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Amount Selection */}
            <div className="space-y-6">
              <div className="text-center">
                <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Chọn mức ủng hộ
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Hoặc nhập số tiền tùy chọn
                </p>
              </div>

              {/* Preset Amounts */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {PRESET_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleAmountSelect(amount)}
                    disabled={loading}
                    className={`relative group border-2 rounded-2xl p-6 text-center transition-all duration-300 ${
                      formData.amount === amount.toString()
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:scale-105'
                    }`}
                  >
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                      ${amount}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      ≈ {formatVND(convertUSDToVND(amount, settings.usdToVndRate))}
                    </div>
                    {formData.amount === amount.toString() && (
                      <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1">
                        <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="space-y-3">
                <Label htmlFor="customAmount" className="text-lg font-semibold">Số tiền tùy chọn (USD)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl font-bold">
                    $
                  </span>
                  <Input
                    id="customAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Nhập số tiền"
                    value={formData.customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    disabled={loading}
                    className="pl-12 pr-4 py-4 text-xl font-bold border-2 rounded-2xl focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                {formData.customAmount && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    ≈ {formatVND(convertUSDToVND(parseFloat(formData.customAmount), settings.usdToVndRate))} VNĐ
                  </p>
                )}
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-6">
              <div className="text-center">
                <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Chọn phương thức thanh toán
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Lựa chọn cách thức ủng hộ phù hợp với bạn
                </p>
              </div>

              <RadioGroup
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                disabled={loading}
                className="grid gap-4"
              >
                {/* Ko-fi Option */}
                {settings.kofiEnabled && (
                  <div className="relative group">
                    <div className={`border-2 rounded-2xl p-6 transition-all duration-300 cursor-pointer ${
                      formData.paymentMethod === 'KOFI' 
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-xl scale-105' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-900/10 hover:scale-102'
                    }`}>
                      <div className="flex items-center space-x-4">
                        <RadioGroupItem value="KOFI" id="kofi" className="mt-1" />
                        <div className="flex items-center gap-4 flex-1">
                          <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-4 shadow-lg">
                            <Coffee className="h-8 w-8 text-white" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-1">Ko-fi</h5>
                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                              Thanh toán quốc tế qua thẻ tín dụng
                            </p>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">✓ Tức thì</span>
                              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">💳 Credit/Debit</span>
                              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">🌍 Global</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">Phí: 0%</div>
                            <div className="text-sm text-gray-500">Miễn phí hoàn toàn</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* VietQR Option */}
                {settings.vietqrEnabled && (
                  <div className="relative group">
                    <div className={`border-2 rounded-2xl p-6 transition-all duration-300 cursor-pointer ${
                      formData.paymentMethod === 'BANK_TRANSFER' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-xl scale-105' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:scale-102'
                    }`}>
                      <div className="flex items-center space-x-4">
                        <RadioGroupItem value="BANK_TRANSFER" id="vietqr" className="mt-1" />
                        <div className="flex items-center gap-4 flex-1">
                          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 shadow-lg">
                            <QrCode className="h-8 w-8 text-white" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-1">VietQR</h5>
                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                              Chuyển khoản ngân hàng qua mã QR (Việt Nam)
                            </p>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">✓ Nhanh chóng</span>
                              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">🏦 Banking</span>
                              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">🇻🇳 VN Only</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">Phí: 0%</div>
                            <div className="text-sm text-gray-500">Miễn phí chuyển khoản</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Manual Option */}
                <div className="relative group">
                  <div className={`border-2 rounded-2xl p-6 transition-all duration-300 cursor-pointer ${
                    formData.paymentMethod === 'MANUAL' 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-xl scale-105' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 hover:scale-102'
                  }`}>
                    <div className="flex items-center space-x-4">
                      <RadioGroupItem value="MANUAL" id="manual" className="mt-1" />
                      <div className="flex items-center gap-4 flex-1">
                        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-4 shadow-lg">
                          <Building2 className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-1">Thủ công</h5>
                          <p className="text-gray-600 dark:text-gray-400 mb-3">
                            Liên hệ trực tiếp với admin để được hướng dẫn
                          </p>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">⏳ Chờ xử lý</span>
                            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">👤 Hỗ trợ 1:1</span>
                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">🔧 Linh hoạt</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">Phí: 0%</div>
                          <div className="text-sm text-gray-500">Không phí phát sinh</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Donor Information */}
            <div className="space-y-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
              <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Thông tin người ủng hộ
              </h4>
              
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="isAnonymous"
                  checked={formData.isAnonymous}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isAnonymous: checked as boolean }))
                  }
                  disabled={loading}
                  className="rounded-lg"
                />
                <Label htmlFor="isAnonymous" className="text-lg">Ủng hộ ẩn danh</Label>
              </div>

              {(formData.isAnonymous || !session) && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="donorName" className="text-lg font-medium">
                      Tên của bạn {formData.isAnonymous && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id="donorName"
                      value={formData.donorName}
                      onChange={(e) => 
                        setFormData(prev => ({ ...prev, donorName: e.target.value }))
                      }
                      disabled={loading}
                      placeholder="Nhập tên của bạn"
                      className="mt-2 py-3 text-lg rounded-2xl border-2"
                    />
                    {formData.isAnonymous && (
                      <p className="text-sm text-gray-600 mt-2">
                        Tên của bạn sẽ không được hiển thị công khai
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="donorEmail" className="text-lg font-medium">Email (tùy chọn)</Label>
                    <Input
                      id="donorEmail"
                      type="email"
                      value={formData.donorEmail}
                      onChange={(e) => 
                        setFormData(prev => ({ ...prev, donorEmail: e.target.value }))
                      }
                      disabled={loading}
                      placeholder="email@example.com"
                      className="mt-2 py-3 text-lg rounded-2xl border-2"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      Để nhận hóa đơn ủng hộ (không hiển thị công khai)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Message */}
            <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
              <div>
                <Label htmlFor="message" className="text-xl font-bold text-gray-900 dark:text-gray-100">Lời nhắn (tùy chọn)</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => 
                    setFormData(prev => ({ ...prev, message: e.target.value }))
                  }
                  disabled={loading}
                  placeholder="Chia sẻ lý do bạn ủng hộ..."
                  rows={4}
                  maxLength={500}
                  className="mt-3 text-lg rounded-2xl border-2"
                />
                <p className="text-sm text-gray-600 mt-2">
                  {formData.message.length}/500 ký tự
                </p>
              </div>

              {formData.message && (
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="isMessagePublic"
                    checked={formData.isMessagePublic}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, isMessagePublic: checked as boolean }))
                    }
                    disabled={loading}
                    className="rounded-lg"
                  />
                  <Label htmlFor="isMessagePublic" className="text-lg">Công khai lời nhắn</Label>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <Button
                type="submit"
                disabled={loading || getFinalAmount() <= 0}
                className="w-full py-6 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                    {formData.paymentMethod === 'KOFI' ? 'Đang chuyển đến Ko-fi...' :
                     formData.paymentMethod === 'BANK_TRANSFER' ? 'Đang tạo mã QR...' :
                     'Đang xử lý...'}
                  </>
                ) : (
                  <>
                    <Heart className="h-6 w-6 mr-3" />
                    {formData.paymentMethod === 'KOFI' ? 'Ủng hộ qua Ko-fi' :
                     formData.paymentMethod === 'BANK_TRANSFER' ? 'Tạo mã QR chuyển khoản' :
                     'Ủng hộ thủ công'} {getFinalAmount() > 0 && `- $${getFinalAmount()}`}
                  </>
                )}
              </Button>
              
              {formData.paymentMethod === 'MANUAL' && (
                <p className="text-sm text-gray-600 text-center mt-4 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  Vui lòng liên hệ admin để được hướng dẫn ủng hộ
                </p>
              )}
            </div>

            {/* Disclaimer */}
            <div className="text-sm text-gray-600 dark:text-gray-400 text-center bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl">
              <p>
                🔒 Khoản ủng hộ của bạn sẽ được xử lý an toàn. Bằng việc ủng hộ, bạn đồng ý với{' '}
                <a href="/terms" className="text-blue-600 hover:underline font-medium">điều khoản dịch vụ</a>{' '}
                và <a href="/privacy" className="text-blue-600 hover:underline font-medium">chính sách bảo mật</a> của chúng tôi.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

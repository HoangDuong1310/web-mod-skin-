// components/donation/donate-form.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useDonation } from '@/hooks/use-donation'
import { calculateTier, TIER_LABELS } from '@/lib/donor-tiers'

const PRESETS = [20_000, 50_000, 100_000, 200_000, 500_000, 1_000_000]

function fmt(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + '₫'
}

interface Props {
  initialAmount?: number
  onSubmitted?: (r: { donationId: string; transferNote: string }) => void
}

export function DonateForm({ initialAmount, onSubmitted }: Props) {
  const { settings, fetchSettings, paymentMethod, setPaymentMethod } = useDonation()
  const [amount, setAmount] = useState<number | null>(initialAmount ?? 50_000)
  const [custom, setCustom] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ transferNote: string } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => { fetchSettings() }, [fetchSettings])
  useEffect(() => { if (initialAmount) setAmount(initialAmount) }, [initialAmount])

  const finalAmount = useMemo(() => {
    if (custom) return Math.max(0, parseInt(custom.replace(/\D/g, '')) || 0)
    return amount ?? 0
  }, [amount, custom])

  const tierHint = calculateTier(finalAmount)

  const qrUrl = useMemo(() => {
    if (paymentMethod !== 'VIETQR' || !settings?.vietqrBankId || !settings.vietqrAccountNo) return ''
    const params = new URLSearchParams()
    if (finalAmount > 0) params.append('amount', String(finalAmount))
    params.append('addInfo', result?.transferNote ?? 'Ung ho du an')
    params.append('accountName', settings.vietqrAccountName ?? '')
    return `https://img.vietqr.io/image/${settings.vietqrBankId}-${settings.vietqrAccountNo}-compact2.jpg?${params.toString()}`
  }, [paymentMethod, settings, finalAmount, result])

  const submit = async () => {
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountVND: finalAmount, paymentMethod, message, isAnonymous: false }),
      })
      if (!res.ok) { setError('Không thể tạo lượt ủng hộ. Thử lại sau.'); return }
      const data = await res.json()
      setResult({ transferNote: data.transferNote })
      onSubmitted?.(data)
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12">
      <div>
        <div className="flex border-b border-neutral-200 mb-8">
          <button onClick={() => setPaymentMethod('VIETQR')}
            className={paymentMethod === 'VIETQR' ? 'pb-3 px-1 mr-6 font-medium border-b-2 border-black -mb-px' : 'pb-3 px-1 mr-6 font-medium text-neutral-500'}>
            VietQR
          </button>
          {settings?.kofiEnabled && (
            <button onClick={() => setPaymentMethod('KOFI')}
              className={paymentMethod === 'KOFI' ? 'pb-3 px-1 font-medium border-b-2 border-black -mb-px' : 'pb-3 px-1 font-medium text-neutral-500'}>
              Ko-fi
            </button>
          )}
        </div>

        {paymentMethod === 'VIETQR' ? (
          <>
            <label className="text-sm font-medium block mb-3">Số tiền</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button key={p} onClick={() => { setAmount(p); setCustom('') }}
                  className={amount === p && !custom
                    ? 'h-10 rounded-md border-2 border-black text-sm font-semibold'
                    : 'h-10 rounded-md border border-neutral-200 text-sm hover:border-black'}>
                  {fmt(p)}
                </button>
              ))}
            </div>
            <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Số tiền tùy chọn"
              className="mt-2 w-full h-10 px-3 rounded-md border border-neutral-200 focus:border-black outline-none text-sm" />
            <label className="text-sm font-medium block mt-6 mb-3">Lời nhắn (tùy chọn)</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
              className="w-full px-3 py-2 rounded-md border border-neutral-200 focus:border-black outline-none text-sm resize-none" />
            {tierHint && (
              <div className="mt-4 text-xs text-neutral-600 border-l-2 border-neutral-900 pl-3">
                Mức {fmt(finalAmount)} tương ứng tier <strong>{TIER_LABELS[tierHint]}</strong>.
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-neutral-600">
            <p>Ủng hộ qua Ko-fi (dành cho người dùng quốc tế):</p>
            <a href={`https://ko-fi.com/${settings?.kofiUsername ?? ''}`} target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-flex items-center h-10 px-5 rounded-md bg-black text-white font-medium">
              Mở Ko-fi
            </a>
          </div>
        )}
      </div>

      {paymentMethod === 'VIETQR' && (
        <div>
          <div className="rounded-lg border border-neutral-200 p-8 bg-neutral-50">
            {qrUrl ? (
              <img src={qrUrl} alt="VietQR" className="w-44 h-44 mx-auto bg-white rounded-md border border-neutral-200 p-2" />
            ) : (
              <div className="w-44 h-44 mx-auto bg-white rounded-md border border-neutral-200 grid place-items-center text-xs text-neutral-400">
                QR sẽ hiện sau khi xác nhận
              </div>
            )}
            {result && (
              <div className="mt-4 text-center text-sm">
                <div className="text-neutral-500 text-xs uppercase tracking-wider">Nội dung chuyển khoản</div>
                <div className="font-mono font-semibold mt-1 bg-white border border-neutral-200 rounded px-2 py-1 inline-block">
                  {result.transferNote}
                </div>
              </div>
            )}
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button onClick={submit} disabled={loading || finalAmount <= 0}
            className="mt-4 w-full h-11 rounded-md bg-black text-white font-medium hover:bg-neutral-800 disabled:opacity-50">
            {loading ? 'Đang xử lý...' : result ? 'Tôi đã chuyển khoản' : 'Tạo mã chuyển khoản'}
          </button>
          <p className="mt-3 text-center text-xs text-neutral-500">Hệ thống xác nhận tự động trong 5 phút.</p>
        </div>
      )}
    </div>
  )
}

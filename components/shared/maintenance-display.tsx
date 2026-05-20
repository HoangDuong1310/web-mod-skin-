'use client'

import { Wrench, Clock, Mail, CalendarClock } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

interface MaintenanceDisplayProps {
  siteName?: string
  supportEmail?: string
  message?: string | null
  estimatedEnd?: string | null
}

function formatEstimatedEnd(value: string): string | null {
  const date = new Date(value)
  if (isNaN(date.getTime())) return null
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(date)
  } catch {
    return date.toLocaleString('vi-VN')
  }
}

function formatCountdown(target: Date): string {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return 'Đang chuẩn bị mở lại...'

  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts: string[] = []
  if (days > 0) parts.push(`${days} ngày`)
  if (hours > 0 || days > 0) parts.push(`${hours} giờ`)
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes} phút`)
  parts.push(`${seconds} giây`)

  return parts.join(' ')
}

export function MaintenanceDisplay({
  siteName = 'Website',
  supportEmail,
  message,
  estimatedEnd,
}: MaintenanceDisplayProps) {
  const estimatedDate = useMemo(() => {
    if (!estimatedEnd) return null
    const d = new Date(estimatedEnd)
    return isNaN(d.getTime()) ? null : d
  }, [estimatedEnd])

  const formattedEnd = useMemo(
    () => (estimatedEnd ? formatEstimatedEnd(estimatedEnd) : null),
    [estimatedEnd]
  )

  const [countdown, setCountdown] = useState<string | null>(
    estimatedDate ? formatCountdown(estimatedDate) : null
  )

  useEffect(() => {
    if (!estimatedDate) {
      setCountdown(null)
      return
    }
    setCountdown(formatCountdown(estimatedDate))
    const interval = setInterval(() => {
      setCountdown(formatCountdown(estimatedDate))
    }, 1000)
    return () => clearInterval(interval)
  }, [estimatedDate])

  const description =
    message && message.trim().length > 0
      ? message
      : `${siteName} hiện đang trong thời gian bảo trì để cải thiện trải nghiệm của bạn.`

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Wrench className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Website đang bảo trì
          </h1>
          <p className="text-gray-600 whitespace-pre-line">
            {description}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {formattedEnd ? (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-left">
              <div className="flex items-center space-x-2 text-blue-800 font-medium mb-1">
                <CalendarClock className="w-4 h-4" />
                <span className="text-sm">Dự kiến mở lại</span>
              </div>
              <p className="text-sm text-blue-900">{formattedEnd}</p>
              {countdown && (
                <p className="text-xs text-blue-700 mt-1">
                  Còn lại: <span className="font-semibold">{countdown}</span>
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2 text-gray-700">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Chúng tôi sẽ quay lại sớm!</span>
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-3">
            Cần hỗ trợ ngay?
          </p>
          {supportEmail && (
            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              <Mail className="w-4 h-4" />
              <span>Liên hệ hỗ trợ</span>
            </a>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Cảm ơn bạn đã kiên nhẫn trong khi chúng tôi cải thiện hệ thống.
          </p>
        </div>
      </div>
    </div>
  )
}

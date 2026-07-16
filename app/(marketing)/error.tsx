'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Marketing error:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Đã xảy ra lỗi</h2>
        <p className="text-muted-foreground mb-6">
          Vui lòng thử lại hoặc quay về trang chủ.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center h-10 px-6 font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Thử lại
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center h-10 px-6 font-medium border border-input bg-background rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}

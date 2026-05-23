import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const metadata = {
  title: 'Founder License',
  description: 'Tải Founder License file cho Ainz',
}

export default async function FounderPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin?callbackUrl=/profile/founder')
  }

  // Check founder status (cast to any until prisma generate runs)
  const user = (await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      isFounder: true,
      founderSince: true,
      founderTier: true,
    } as any,
  })) as null | {
    isFounder: boolean
    founderSince: Date | null
    founderTier: string | null
  }

  const isFounder = user?.isFounder ?? false
  const founderSince = user?.founderSince
  const founderTier = user?.founderTier

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Founder License</h1>
          <p className="text-muted-foreground mt-2">
            Tải Founder License file để kích hoạt đặc quyền trong Ainz
          </p>
        </div>

        {isFounder ? (
          <div className="space-y-6">
            {/* Founder Status Card */}
            <div className="rounded-lg border bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center">
                  <span className="text-white text-xl">👑</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    Founder — {founderTier || 'BASIC'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Thành viên từ{' '}
                    {founderSince
                      ? new Date(founderSince).toLocaleDateString('vi-VN')
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Cảm ơn bạn đã ủng hộ Ainz từ những ngày đầu! Bạn được giữ vĩnh viễn
                các đặc quyền Founder — không thể mua được nữa.
              </p>

              {/* Perks list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-500">✓</span> Huy hiệu Founder trong app
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-500">✓</span> Theme Gold độc quyền
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-500">✓</span> Bộ button riêng
                </div>
                {(founderTier === 'PRO' || founderTier === 'LIFETIME') && (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-500">✓</span> Nhận update sớm
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-500">✓</span> Không giới hạn rate
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Download Section */}
            <div className="rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-2">Tải Founder License</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tải file license và đặt vào thư mục{' '}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">
                  %LOCALAPPDATA%\Ainz\
                </code>{' '}
                hoặc dùng nút &quot;Import Founder License&quot; trong app.
              </p>

              <a
                href="/api/founder/license"
                download="founder_license.json"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
              >
                ⬇️ Tải founder_license.json
              </a>

              <div className="mt-4 p-3 rounded bg-muted/50 text-xs text-muted-foreground">
                <strong>Hướng dẫn:</strong>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Bấm nút tải ở trên</li>
                  <li>
                    Copy file <code>founder_license.json</code> vào{' '}
                    <code>%LOCALAPPDATA%\Ainz\</code>
                  </li>
                  <li>Khởi động lại Ainz — badge Founder sẽ hiện</li>
                </ol>
              </div>
            </div>
          </div>
        ) : (
          /* Not a Founder */
          <div className="rounded-lg border p-6 text-center">
            <div className="text-4xl mb-4">🎁</div>
            <h2 className="text-xl font-semibold mb-2">
              Ainz hiện đã miễn phí!
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Bạn có thể sử dụng đầy đủ tính năng mà không cần license key.
              Trang này dành riêng cho những người đã ủng hộ Ainz trước khi
              chuyển sang miễn phí.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

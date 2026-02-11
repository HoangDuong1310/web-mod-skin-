import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageReviews } from '@/lib/auth-utils'
import ReviewFilterManagement from '@/components/dashboard/review-filter-management'

export default async function ReviewFiltersPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!canManageReviews(session.user.role)) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Bộ lọc Review</h1>
        <p className="text-muted-foreground">
          Thiết lập quy tắc tự động lọc review spam, từ ngữ không phù hợp, URL và email
        </p>
      </div>
      <ReviewFilterManagement />
    </div>
  )
}

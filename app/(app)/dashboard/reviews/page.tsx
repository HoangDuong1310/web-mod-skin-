import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageReviews } from '@/lib/auth-utils'
import ReviewManagement from '@/components/dashboard/review-management'

export default async function ReviewsPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">Review Management</h1>
        <p className="text-muted-foreground">
          Moderate customer reviews and manage feedback
        </p>
      </div>
      <ReviewManagement />
    </div>
  )
}

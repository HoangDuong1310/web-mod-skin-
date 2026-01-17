import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { UserLicensesClient } from '@/components/user/user-licenses-client'

export const metadata = {
  title: 'License Keys của tôi',
  description: 'Xem và quản lý các license keys của bạn',
}

export default async function UserLicensesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin?callbackUrl=/profile/licenses')
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">License Keys của tôi</h1>
          <p className="text-muted-foreground mt-2">
            Xem và quản lý các license keys bạn đã mua
          </p>
        </div>
        
        <UserLicensesClient />
      </div>
    </div>
  )
}

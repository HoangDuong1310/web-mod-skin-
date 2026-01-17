import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserOrdersClient } from '@/components/user/user-orders-client'

export const metadata = {
  title: 'Lịch sử đơn hàng | Profile',
  description: 'Xem lịch sử đơn hàng của bạn',
}

export default async function UserOrdersPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin?callbackUrl=/profile/orders')
  }

  return (
    <div className="container max-w-4xl py-8">
      <UserOrdersClient />
    </div>
  )
}

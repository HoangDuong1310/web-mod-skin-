import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { OrdersClient } from '@/components/dashboard/orders/orders-client'

export const metadata = {
  title: 'Quản lý đơn hàng | Dashboard',
  description: 'Quản lý tất cả đơn hàng và thanh toán',
}

export default async function OrdersPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  const userRole = (session.user as any).role
  if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
    redirect('/')
  }

  return <OrdersClient />
}
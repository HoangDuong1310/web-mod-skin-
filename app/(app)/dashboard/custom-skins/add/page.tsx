import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminCustomSkinUpload from '@/components/dashboard/admin-custom-skin-upload'

export const metadata: Metadata = {
  title: 'Thêm Custom Skin | Admin Dashboard',
  description: 'Upload và thêm custom skin mới vào hệ thống'
}

export default async function AddCustomSkinPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto py-6">
      <AdminCustomSkinUpload />
    </div>
  )
}
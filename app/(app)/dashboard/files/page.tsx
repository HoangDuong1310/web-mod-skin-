import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import FileManagement from '@/components/dashboard/file-management'

export const metadata: Metadata = {
  title: 'File Management | Admin Dashboard',
  description: 'Manage skin files, uploads, and storage'
}

export default async function FileManagementPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">File Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage skin files, uploads, and storage
        </p>
      </div>
      
      <FileManagement />
    </div>
  )
}
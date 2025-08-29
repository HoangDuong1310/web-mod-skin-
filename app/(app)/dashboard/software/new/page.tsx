import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import NewSoftwareClient from './new-software-client'

export const metadata = {
  title: 'Add New Software - Admin Dashboard',
  description: 'Add new software to the platform',
}

export default async function NewSoftwarePage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/')
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Add New Software</h2>
        <p className="text-muted-foreground">
          Add new software to your platform
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Software Details</CardTitle>
        </CardHeader>
        <CardContent>
          <NewSoftwareClient />
        </CardContent>
      </Card>
    </div>
  )
}

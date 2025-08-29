import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { NewUserClient } from './new-user-client'

export default async function NewUserPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/')
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Create New User</h2>
            <p className="text-muted-foreground">
              Add a new user to the system
            </p>
          </div>
        </div>
      </div>

      <NewUserClient />
    </div>
  )
}

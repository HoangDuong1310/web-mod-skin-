import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { NewTagClient } from './new-tag-client'

export default async function NewTagPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  if (!['ADMIN', 'STAFF'].includes(session.user.role)) {
    redirect('/')
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/tags">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tags
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Create New Tag</h2>
            <p className="text-muted-foreground">
              Add a new tag to organize your blog posts
            </p>
          </div>
        </div>
      </div>

      <NewTagClient />
    </div>
  )
}

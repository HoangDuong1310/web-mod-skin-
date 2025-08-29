import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft,
  FileText,
  Save
} from 'lucide-react'
import Link from 'next/link'
import { NewPostClient } from './new-post-client'

export default async function NewPostPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  if (!['ADMIN', 'STAFF'].includes(session.user.role)) {
    redirect('/')
  }

  // Get all available tags
  const tags = await prisma.tag.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/content">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Content
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Create New Post</h2>
            <p className="text-muted-foreground">
              Write and publish a new blog post
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Publish Post
          </Button>
        </div>
      </div>

      <NewPostClient 
        authorId={session.user.id}
        authorName={session.user.name || session.user.email || 'Unknown'}
        tags={tags}
      />
    </div>
  )
}

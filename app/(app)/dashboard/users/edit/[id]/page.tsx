import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import { EditUserClient } from './edit-user-client'

interface EditUserPageProps {
  params: { id: string }
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/')
  }

  // Get user data with activity
  const [user, userActivity] = await Promise.all([
    prisma.user.findUnique({
      where: { id: params.id, deletedAt: null },
      include: {
        _count: {
          select: {
            downloads: true,
            reviews: true,
            posts: true,
          },
        },
      },
    }),
    
    // Get recent user activity
    prisma.download.findMany({
      where: { userId: params.id },
      include: {
        product: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  if (!user) {
    notFound()
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'destructive'
      case 'STAFF': return 'default'
      case 'USER': return 'secondary'
      default: return 'outline'
    }
  }

  const isOwnProfile = session.user.id === user.id

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
            <h2 className="text-3xl font-bold tracking-tight">Edit User</h2>
            <p className="text-muted-foreground">
              Update user information and permissions
            </p>
          </div>
        </div>
      </div>

      <EditUserClient user={user} currentUserId={session.user.id} />
    </div>
  )
}

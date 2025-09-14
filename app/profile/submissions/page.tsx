import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MySubmissionsClient } from '@/components/custom-skins/my-submissions-client'

export default async function MySubmissionsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const submissions = await (prisma as any).skinSubmission.findMany({
    where: {
      submitterId: session.user.id,
      deletedAt: null
    },
    include: {
      champion: {
        select: {
          id: true,
          name: true,
          alias: true,
          squarePortraitPath: true
        }
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      reviewer: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            My Submissions
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your custom skin submissions
          </p>
        </div>

        <MySubmissionsClient submissions={submissions} />
      </div>
    </div>
  )
}

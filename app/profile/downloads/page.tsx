'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import MyDownloads from '@/components/user/my-downloads'

export default function UserDownloadsPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="animate-pulse text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/profile">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">My Downloads</h1>
            <p className="text-muted-foreground">View your download history and re-download software</p>
          </div>
        </div>

        <MyDownloads />
      </div>
    </div>
  )
}

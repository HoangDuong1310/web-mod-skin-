import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { 
  Tag, 
  Plus, 
  Hash,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { TagsClient } from './tags-client'

export default async function TagsManagementPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  if (!['ADMIN', 'STAFF'].includes(session.user.role)) {
    redirect('/')
  }

  // Get tags with post counts
  const tags = await prisma.tag.findMany({
    where: { deletedAt: null },
    include: {
      _count: {
        select: {
          postTags: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  const stats = {
    totalTags: tags.length,
    activeTags: tags.filter(tag => tag._count.postTags > 0).length,
    unusedTags: tags.filter(tag => tag._count.postTags === 0).length,
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tags Management</h2>
          <p className="text-muted-foreground">
            Organize your blog content with tags
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/blog">
              Back to Blog
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/tags/new">
              <Plus className="h-4 w-4 mr-2" />
              New Tag
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tags</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTags}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tags</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeTags}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unused Tags</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.unusedTags}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tags Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tags</CardTitle>
          <CardDescription>
            Manage your blog tags and their usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TagsClient tags={tags} />
        </CardContent>
      </Card>
    </div>
  )
}

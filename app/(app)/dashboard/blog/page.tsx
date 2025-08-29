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
  FileText, 
  Plus, 
  Eye, 
  Edit, 
  TrendingUp,
  MessageSquare
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { BlogClient } from './blog-client'

export default async function BlogManagementPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  if (!['ADMIN', 'STAFF'].includes(session.user.role)) {
    redirect('/')
  }

  // Get blog posts with engagement stats
  const [posts, totalViews, recentComments] = await Promise.all([
    prisma.post.findMany({
      where: { deletedAt: null },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
        postTags: {
          include: {
            tag: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
    }),
    
    // Mock total views (you can add a views table later)
    Promise.resolve(45230), // Fixed number to avoid hydration mismatch
    
    // Mock recent comments (you can add a comments table later) 
    Promise.resolve([
      { id: '1', author: 'John Doe', content: 'Great article!', postTitle: 'Getting Started', createdAt: new Date('2024-01-15T10:00:00Z') },
      { id: '2', author: 'Jane Smith', content: 'Very helpful, thanks!', postTitle: 'Advanced Tips', createdAt: new Date('2024-01-14T15:30:00Z') },
      { id: '3', author: 'Bob Wilson', content: 'Could you expand on this?', postTitle: 'Best Practices', createdAt: new Date('2024-01-13T09:15:00Z') },
    ])
  ])

  const stats = {
    totalPosts: posts.length,
    published: posts.filter(p => p.status === 'PUBLISHED').length,
    drafts: posts.filter(p => p.status === 'DRAFT').length,
    totalViews,
  }





  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Blog Management</h2>
          <p className="text-muted-foreground">
            Create and manage your blog content
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/tags">
              Manage Tags
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/blog/new">
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.drafts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Posts Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Blog Posts</CardTitle>
              <CardDescription>
                Manage your blog posts and articles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BlogClient posts={posts} />
            </CardContent>
          </Card>
        </div>

        {/* Recent Comments */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Comments</CardTitle>
              <CardDescription>
                Latest reader feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentComments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No recent comments
                  </p>
                ) : (
                  recentComments.map((comment) => (
                    <div key={comment.id} className="flex items-start space-x-3 text-sm">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-1" />
                      <div className="flex-1 space-y-1">
                        <p className="font-medium">{comment.author}</p>
                        <p className="text-muted-foreground line-clamp-2">
                          {comment.content}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          on "{comment.postTitle}" • {formatDate(comment.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

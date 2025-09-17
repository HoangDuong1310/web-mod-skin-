import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  FileText, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar, 
  User,
  Tag
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function ContentManagementPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  if (!['ADMIN', 'STAFF'].includes(session.user.role)) {
    redirect('/')
  }

  // Get blog posts with stats
  const [posts, postsStats] = await Promise.all([
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
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    
    prisma.post.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { id: true },
    }),
  ])

  const stats = {
    total: posts.length,
    published: postsStats.find(s => s.status === 'PUBLISHED')?._count.id || 0,
    draft: postsStats.find(s => s.status === 'DRAFT')?._count.id || 0,
    archived: postsStats.find(s => s.status === 'ARCHIVED')?._count.id || 0,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'default'
      case 'DRAFT': return 'secondary'
      case 'ARCHIVED': return 'outline'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Content Management</h2>
          <p className="text-muted-foreground">
            Manage blog posts, articles, and content
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/content/new">
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
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
            <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.archived}</div>
          </CardContent>
        </Card>
      </div>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Blog Posts</CardTitle>
          <CardDescription>
            Manage your blog posts and articles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No posts found</p>
                        <Button asChild size="sm">
                          <Link href="/dashboard/content/new">
                            Create your first post
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium leading-none">{post.title}</p>
                          {post.excerpt && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {post.excerpt}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {post.author.name || 'Anonymous'}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={getStatusColor(post.status)}>
                          {post.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {post.postTags.slice(0, 2).map((postTag) => (
                            <Badge 
                              key={postTag.tag.slug} 
                              variant="outline" 
                              className="text-xs"
                            >
                              {postTag.tag.name}
                            </Badge>
                          ))}
                          {post.postTags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{post.postTags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDate(post.publishedAt || post.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/blog/${post.slug}`} target="_blank">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/content/edit/${post.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


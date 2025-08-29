import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft,
  Save,
  Eye,
  FileText,
  Tag
} from 'lucide-react'
import Link from 'next/link'

interface EditPostPageProps {
  params: { id: string }
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  if (!['ADMIN', 'STAFF'].includes(session.user.role)) {
    redirect('/')
  }

  // Get post data
  const [post, tags] = await Promise.all([
    prisma.post.findUnique({
      where: { id: params.id, deletedAt: null },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
        postTags: {
          include: {
            tag: true,
          },
        },
      },
    }),
    
    // Get all available tags
    prisma.tag.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!post) {
    notFound()
  }

  const currentTags = post.postTags.map(pt => pt.tag)

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
            <h2 className="text-3xl font-bold tracking-tight">Edit Post</h2>
            <p className="text-muted-foreground">
              Update your blog post content and settings
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/blog/${post.slug}`} target="_blank">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Link>
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Update Post
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Post Content</CardTitle>
              <CardDescription>
                Edit your post title, excerpt, and content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  defaultValue={post.title}
                  placeholder="Enter post title..."
                  className="text-lg"
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  defaultValue={post.slug}
                  placeholder="URL-friendly version of title"
                />
                <p className="text-sm text-muted-foreground">
                  URL: /blog/{post.slug} (be careful when changing - will break existing links)
                </p>
              </div>

              {/* Excerpt */}
              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  defaultValue={post.excerpt || ''}
                  placeholder="Brief description of your post..."
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Short description shown in post previews
                </p>
              </div>

              {/* Featured Image */}
              <div className="space-y-2">
                <Label htmlFor="featured-image">Featured Image URL</Label>
                <Input
                  id="featured-image"
                  defaultValue={post.featuredImage || ''}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  defaultValue={post.content}
                  placeholder="Write your post content here..."
                  rows={20}
                  className="font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  Supports HTML markup. Use h2, h3 tags with IDs for table of contents.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Post Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Post Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select defaultValue={post.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Featured */}
              <div className="space-y-2">
                <Label>Featured Post</Label>
                <Select defaultValue={post.featured ? 'true' : 'false'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Author */}
              <div className="space-y-2">
                <Label>Author</Label>
                <p className="text-sm bg-muted p-2 rounded">
                  {post.author.name || post.author.email}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>
                Organize your post with tags
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Tags */}
              <div className="space-y-2">
                <Label>Current Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {currentTags.length > 0 ? (
                    currentTags.map((tag) => (
                      <Badge key={tag.id} variant="secondary">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag.name}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No tags assigned</p>
                  )}
                </div>
              </div>

              {/* Available Tags */}
              <div className="space-y-2">
                <Label>Available Tags</Label>
                <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-3">
                  {tags.map((tag) => {
                    const isAssigned = currentTags.some(ct => ct.id === tag.id)
                    return (
                      <div key={tag.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`tag-${tag.id}`}
                          defaultChecked={isAssigned}
                          className="rounded"
                        />
                        <Label
                          htmlFor={`tag-${tag.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {tag.name}
                        </Label>
                      </div>
                    )
                  })}
                </div>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/dashboard/tags">
                    Manage Tags
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
              <CardDescription>
                Search engine optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta-title">Meta Title</Label>
                <Input
                  id="meta-title"
                  defaultValue={post.metaTitle || ''}
                  placeholder="SEO title (max 60 chars)"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use post title
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta-description">Meta Description</Label>
                <Textarea
                  id="meta-description"
                  defaultValue={post.metaDescription || ''}
                  placeholder="SEO description (max 160 chars)"
                  maxLength={160}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

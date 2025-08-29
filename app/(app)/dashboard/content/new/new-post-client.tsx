'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Save,
  FileText,
  Tag
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface TagData {
  id: string
  name: string
  slug: string
  description?: string | null
}

interface NewPostClientProps {
  authorId: string
  authorName: string
  tags: TagData[]
}

export function NewPostClient({ authorId, authorName, tags }: NewPostClientProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    featuredImage: '',
    content: '',
    status: 'DRAFT',
    featured: false,
    metaTitle: '',
    metaDescription: '',
    selectedTags: [] as string[],
  })

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      // Only auto-update slug if it's empty or auto-generated
      slug: (!prev.slug || prev.slug === generateSlug(prev.title)) 
        ? generateSlug(title) 
        : prev.slug
    }))
  }

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagId)
        ? prev.selectedTags.filter(id => id !== tagId)
        : [...prev.selectedTags, tagId]
    }))
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Title is required')
      return false
    }
    if (!formData.content.trim()) {
      toast.error('Content is required')
      return false
    }
    if (formData.title.length > 200) {
      toast.error('Title must not exceed 200 characters')
      return false
    }
    if (formData.slug.trim() && !/^[a-z0-9-]+$/.test(formData.slug.trim())) {
      toast.error('Slug must contain only lowercase letters, numbers, and hyphens')
      return false
    }
    if (formData.metaTitle && formData.metaTitle.length > 60) {
      toast.error('Meta title must not exceed 60 characters')
      return false
    }
    if (formData.metaDescription && formData.metaDescription.length > 160) {
      toast.error('Meta description must not exceed 160 characters')
      return false
    }
    return true
  }

  const handleSubmit = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!validateForm()) return

    setIsSubmitting(true)
    
    try {
      const postData = {
        ...formData,
        status,
        authorId,
        tags: formData.selectedTags,
        publishedAt: status === 'PUBLISHED' ? new Date().toISOString() : null,
      }

      console.log('🔵 Creating post with data:', postData)

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create post')
      }

      const result = await response.json()
      console.log('✅ Post created:', result)

      toast.success(`Post ${status === 'PUBLISHED' ? 'published' : 'saved as draft'} successfully!`)
      router.push(`/dashboard/content`)
      router.refresh()

    } catch (error) {
      console.error('❌ Error creating post:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Post Content</CardTitle>
            <CardDescription>
              Create your post title, excerpt, and content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter post title..."
                className="text-lg"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/200 characters
              </p>
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="Leave empty to auto-generate from title"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              />
              <p className="text-sm text-muted-foreground">
                URL: /blog/{formData.slug || (formData.title ? generateSlug(formData.title) : '[auto-generated]')}
              </p>
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                placeholder="Brief description of your post..."
                rows={3}
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground">
                {formData.excerpt.length}/300 characters
              </p>
            </div>

            {/* Featured Image */}
            <div className="space-y-2">
              <Label htmlFor="featured-image">Featured Image URL</Label>
              <Input
                id="featured-image"
                placeholder="https://example.com/image.jpg"
                value={formData.featuredImage}
                onChange={(e) => setFormData(prev => ({ ...prev, featuredImage: e.target.value }))}
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                placeholder="Write your post content here..."
                rows={20}
                className="font-mono text-sm"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
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
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
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
              <Select 
                value={formData.featured.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, featured: value === 'true' }))}
              >
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
                {authorName}
              </p>
            </div>

            {/* Publish Actions */}
            <div className="space-y-2 pt-4 border-t">
              <Button
                className="w-full"
                onClick={() => handleSubmit('DRAFT')}
                disabled={isSubmitting}
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Saving...' : 'Save as Draft'}
              </Button>
              
              <Button
                className="w-full"
                onClick={() => handleSubmit('PUBLISHED')}
                disabled={isSubmitting}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Publishing...' : 'Publish Post'}
              </Button>
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
            {/* Selected Tags */}
            <div className="space-y-2">
              <Label>Selected Tags</Label>
              <div className="flex flex-wrap gap-2 min-h-8">
                {formData.selectedTags.length > 0 ? (
                  formData.selectedTags.map((tagId) => {
                    const tag = tags.find(t => t.id === tagId)
                    return tag ? (
                      <Badge key={tagId} variant="secondary">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag.name}
                      </Badge>
                    ) : null
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">No tags selected</p>
                )}
              </div>
            </div>

            {/* Available Tags */}
            <div className="space-y-2">
              <Label>Available Tags</Label>
              {tags.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-3">
                  {tags.map((tag) => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`tag-${tag.id}`}
                        checked={formData.selectedTags.includes(tag.id)}
                        onChange={() => handleTagToggle(tag.id)}
                        className="rounded"
                      />
                      <Label
                        htmlFor={`tag-${tag.id}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {tag.name}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No tags available. Create some tags first.
                </p>
              )}
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
                placeholder="SEO title (max 60 chars)"
                maxLength={60}
                value={formData.metaTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                {formData.metaTitle.length}/60 characters (empty = use post title)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta-description">Meta Description</Label>
              <Textarea
                id="meta-description"
                placeholder="SEO description (max 160 chars)"
                maxLength={160}
                rows={3}
                value={formData.metaDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                {formData.metaDescription.length}/160 characters
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

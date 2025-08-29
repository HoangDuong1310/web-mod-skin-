'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Save,
  Tag,
  Hash
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export function NewTagClient() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  })

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name)
    }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Tag name is required')
      return false
    }
    if (!formData.slug.trim()) {
      toast.error('Slug is required')
      return false
    }
    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      toast.error('Slug must contain only lowercase letters, numbers, and hyphens')
      return false
    }
    if (formData.name.length > 50) {
      toast.error('Tag name must not exceed 50 characters')
      return false
    }
    if (formData.description.length > 200) {
      toast.error('Description must not exceed 200 characters')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    
    try {
      const tagData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || undefined,
      }

      console.log('🔵 Creating tag with data:', tagData)

      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tagData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.log('❌ Error response:', errorData)
        
        if (errorData.details && Array.isArray(errorData.details)) {
          const errorMessages = errorData.details.map((detail: any) => `${detail.field}: ${detail.message}`).join(', ')
          throw new Error(`${errorData.error}: ${errorMessages}`)
        }
        
        throw new Error(errorData.error || 'Failed to create tag')
      }

      const result = await response.json()
      console.log('✅ Tag created:', result)

      toast.success('Tag created successfully!')
      router.push('/dashboard/tags')
      router.refresh()

    } catch (error) {
      console.error('❌ Error creating tag:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create tag')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Tag Information</CardTitle>
          <CardDescription>
            Set up your new tag with name, slug, and description
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Tag Name *</Label>
            <Input
              id="name"
              placeholder="e.g. Technology, Tutorial, Review"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              {formData.name.length}/50 characters
            </p>
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              placeholder="e.g. technology, tutorial, review"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
            />
            <p className="text-sm text-muted-foreground">
              URL-friendly version (lowercase, no spaces)
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description for this tag..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/200 characters
            </p>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline">
                  {formData.name || 'Tag Name'}
                </Badge>
                <code className="text-sm bg-background px-2 py-1 rounded">
                  {formData.slug || 'tag-slug'}
                </code>
              </div>
              {formData.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {formData.description}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" asChild>
              <Link href="/dashboard/tags">
                Cancel
              </Link>
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.name.trim() || !formData.slug.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Creating...' : 'Create Tag'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Guidelines */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Tag Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Use descriptive names that clearly indicate content type</p>
          <p>• Keep tag names short and focused</p>
          <p>• Use consistent naming conventions</p>
          <p>• Avoid creating duplicate or very similar tags</p>
          <p>• Tags help readers discover related content</p>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Upload, X, FileText, Image as ImageIcon, File } from 'lucide-react'

interface AddSoftwareFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function AddSoftwareForm({ onSuccess, onCancel }: AddSoftwareFormProps) {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    version: '',
    categoryId: '',
    description: '',
    content: '',
    price: '0',
    stock: '9999',
    status: 'DRAFT' as 'PUBLISHED' | 'DRAFT',
    metaTitle: '',
    metaDescription: '',
    downloadUrl: '',
    externalUrl: ''
  })

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Categories fetch error:', error)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        alert('File size must be less than 100MB')
        return
      }

      // Check file type
      const allowedTypes = [
        'application/x-msdos-program',
        'application/x-msdownload',
        'application/octet-stream',
        'application/zip',
        'application/x-zip-compressed',
        'application/x-rar-compressed',
        'application/x-7z-compressed'
      ]
      
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(exe|msi|zip|rar|7z)$/i)) {
        alert('Only executable files (.exe, .msi) and archives (.zip, .rar, .7z) are allowed')
        return
      }

      setSelectedFile(file)
      
      // Create preview for non-executable files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => setPreviewUrl(e.target?.result as string)
        reader.readAsDataURL(file)
      }
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!formData.title.trim() || !formData.version.trim() || !formData.categoryId || !selectedFile) {
      alert('Please fill in all required fields and select a file')
      return
    }

    setLoading(true)

    try {
      // Create FormData for file upload
      const uploadData = new FormData()
      uploadData.append('file', selectedFile)
      uploadData.append('title', formData.title.trim())
      uploadData.append('version', formData.version.trim())
      uploadData.append('categoryId', formData.categoryId)
      uploadData.append('description', formData.description.trim())
      uploadData.append('content', formData.content.trim())
      uploadData.append('status', formData.status)

      const response = await fetch('/api/admin/software/upload', {
        method: 'POST',
        body: uploadData
      })

      if (response.ok) {
        alert('Software added successfully!')
        // Reset form
        setFormData({
          title: '',
          slug: '',
          version: '',
          categoryId: '',
          description: '',
          content: '',
          price: '0',
          stock: '9999',
          status: 'DRAFT',
          metaTitle: '',
          metaDescription: '',
          downloadUrl: '',
          externalUrl: ''
        })
        setSelectedFile(null)
        setPreviewUrl(null)
        onSuccess?.()
      } else {
        const error = await response.json()
        alert(`Error: ${error.message || 'Failed to add software'}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload software. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Software Name *</Label>
            <Input
              id="name"
              value={formData.title}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Adobe Photoshop"
              required
            />
          </div>
          <div>
            <Label htmlFor="version">Version *</Label>
            <Input
              id="version"
              value={formData.version}
              onChange={(e) => handleInputChange('version', e.target.value)}
              placeholder="e.g., 2024.1.0"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Brief description of the software..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            placeholder="Detailed content about the software features, installation guide, requirements..."
            rows={6}
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value: 'PUBLISHED' | 'DRAFT') => handleInputChange('status', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* File Upload */}
      <div className="space-y-4">
        <Label>Software File *</Label>
        
        {!selectedFile ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileSelect}
              accept=".exe,.msi,.zip,.rar,.7z"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <Upload className="h-12 w-12 text-gray-400" />
              <div className="text-sm">
                <span className="font-medium text-blue-600 hover:text-blue-500">
                  Click to upload
                </span>
                <span className="text-gray-500"> or drag and drop</span>
              </div>
              <p className="text-xs text-gray-500">
                Supported formats: EXE, MSI, ZIP, RAR, 7Z (Max 100MB)
              </p>
            </label>
          </div>
        ) : (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !selectedFile}
        >
          {loading ? 'Uploading...' : 'Add Software'}
        </Button>
      </div>
    </form>
  )
}

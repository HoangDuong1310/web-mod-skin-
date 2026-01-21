'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { getImageUrl } from '@/lib/utils'
import { UPLOAD_BASE_URL } from '@/lib/upload-config'
import {
  Package, Plus, Download, Search, Edit, Trash2, Eye,
  Upload, X, Image as ImageIcon, ExternalLink, File, Copy, Key
} from 'lucide-react'
import Image from 'next/image'

interface Software {
  id: string
  name: string  // API returns 'name' 
  slug: string
  description: string | null
  content: string | null
  version: string | null
  price: number
  stock: number
  status: 'PUBLISHED' | 'DRAFT'
  images: string[]
  downloadUrl: string | null
  filename: string | null
  fileSize: string | null
  externalUrl: string | null
  metaTitle: string | null
  metaDescription: string | null
  category: string  // API returns category name as string
  categorySlug: string
  createdAt: string
  updatedAt: string
  downloads: number  // API returns downloads count
  averageRating: number
  totalReviews: number
  // Key settings
  requiresKey?: boolean
  adBypassEnabled?: boolean
  freeKeyPlanId?: string | null
}

interface Category {
  id: string
  name: string
  slug: string
}

interface SubscriptionPlan {
  id: string
  name: string
  slug: string
}

interface FormData {
  title: string
  slug: string
  description: string
  content: string
  version: string
  price: string
  stock: string
  status: string
  categoryId: string
  metaTitle: string
  metaDescription: string
  downloadUrl: string
  externalUrl: string
  // Key settings
  requiresKey: boolean
  adBypassEnabled: boolean
  freeKeyPlanId: string
}

const apiTypes = [
  { type: 'version', label: 'Version API', path: '/version' },
  { type: 'info', label: 'Product Info API', path: '' },
  { type: 'download', label: 'Download Info API', path: '/download-info' }
]

export default function EnhancedSoftwareManagement() {
  const [software, setSoftware] = useState<Software[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingSoftware, setEditingSoftware] = useState<Software | null>(null)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [downloadFile, setDownloadFile] = useState<File | null>(null)
  const [apiTypeIndex, setApiTypeIndex] = useState<Record<string, number>>({})
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([])

  const [formData, setFormData] = useState<FormData>({
    title: '',
    slug: '',
    description: '',
    content: '',
    version: '',
    price: '0',
    stock: '9999',
    status: 'DRAFT',
    categoryId: '',
    metaTitle: '',
    metaDescription: '',
    downloadUrl: '',
    externalUrl: '',
    requiresKey: false,
    adBypassEnabled: false,
    freeKeyPlanId: ''
  })

  useEffect(() => {
    fetchSoftware()
    fetchCategories()
    fetchSubscriptionPlans()
  }, [searchTerm, statusFilter])

  const fetchSoftware = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/admin/software?${params}`)
      if (!response.ok) throw new Error('Failed to fetch software')

      const data = await response.json()
      setSoftware(data.software || [])
    } catch (error) {
      console.error('Fetch error:', error)
      toast.error('Failed to load software')
    } finally {
      setLoading(false)
    }
  }

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

  const fetchSubscriptionPlans = async () => {
    try {
      const response = await fetch('/api/plans')
      if (response.ok) {
        const data = await response.json()
        // API returns { success: true, data: plans[] }
        setSubscriptionPlans(data.data || [])
      }
    } catch (error) {
      console.error('Plans fetch error:', error)
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

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      description: '',
      content: '',
      version: '',
      price: '0',
      stock: '9999',
      status: 'DRAFT',
      categoryId: '',
      metaTitle: '',
      metaDescription: '',
      downloadUrl: '',
      externalUrl: '',
      requiresKey: false,
      adBypassEnabled: false,
      freeKeyPlanId: ''
    })
    setSelectedImages([])
    setDownloadFile(null)
    setEditingSoftware(null)
    setUploadStatus('')
    setUploadProgress(0)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      if (files.length + selectedImages.length > 10) {
        toast.error('Maximum 10 images allowed')
        return
      }
      setSelectedImages(prev => [...prev, ...files])
    }
  }

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeCurrentImage = (index: number, imageUrl: string) => {
    if (!editingSoftware) return

    try {
      // Parse current images
      let currentImages: string[] = []
      if (editingSoftware.images) {
        if (Array.isArray(editingSoftware.images)) {
          currentImages = editingSoftware.images
        } else if (typeof editingSoftware.images === 'string') {
          currentImages = JSON.parse(editingSoftware.images as string)
        }
      }

      // Remove image from array
      const updatedImages = currentImages.filter((_, i) => i !== index)

      // Update editingSoftware state - keep as array since that's the interface
      setEditingSoftware({
        ...editingSoftware,
        images: updatedImages
      })

    } catch (error) {
      console.error('Error removing image:', error)
      toast.error('Failed to remove image')
    }
  }

  const handleDownloadFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDownloadFile(e.target.files[0])
    }
  }

  const uploadImages = async (productId: string) => {
    if (selectedImages.length === 0) return []

    setUploadingImages(true)
    try {
      const formData = new FormData()
      selectedImages.forEach(file => {
        formData.append('images', file)
      })

      const response = await fetch(`/api/admin/products/${productId}/images`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to upload images')
      }

      const data = await response.json()
      toast.success(`Uploaded ${data.images.length} image(s) successfully`)
      return data.images
    } catch (error) {
      console.error('Image upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload images')
      throw error
    } finally {
      setUploadingImages(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setUploadStatus('')
    setUploadProgress(0)

    try {
      // Validate form data before processing
      const price = parseFloat(formData.price)
      const stock = parseInt(formData.stock)

      if (isNaN(price) || price < 0) {
        toast.error('Please enter a valid price')
        return
      }

      if (isNaN(stock) || stock < 0) {
        toast.error('Please enter a valid stock quantity')
        return
      }

      if (!formData.categoryId || formData.categoryId === '') {
        toast.error('Please select a category')
        return
      }

      // Create or update product
      const productData: any = {
        ...formData,
        price: price,
        stock: stock
      }

      // Do NOT send empty URLs to avoid clearing existing values on server
      if (!productData.downloadUrl || productData.downloadUrl.trim() === '') {
        delete productData.downloadUrl
      }
      if (!productData.externalUrl || productData.externalUrl.trim() === '') {
        delete productData.externalUrl
      }

      console.log('Product data to send:', productData) // Debug log

      let productId: string

      if (editingSoftware) {
        // Update existing product data first
        const updateData: any = {
          ...productData,
        }

        // Preserve images from editing state (array) so removals/additions are respected
        if (Array.isArray(editingSoftware.images)) {
          updateData.images = JSON.stringify(editingSoftware.images)
        }

        console.log('Update data with preserved images:', updateData) // Debug log

        const response = await fetch(`/api/admin/software/${editingSoftware.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('API Error:', errorData)
          throw new Error(errorData.message || 'Failed to update product')
        }
        const data = await response.json()
        productId = data.product.id

        // Upload new download file if provided during edit
        if (downloadFile) {
          console.log(`🔄 Starting file upload: ${downloadFile.name} (${(downloadFile.size / 1024 / 1024).toFixed(2)}MB)`)
          setUploadStatus(`Uploading file: ${downloadFile.name}...`)
          setUploadProgress(10)

          const fileFormData = new FormData()
          fileFormData.append('file', downloadFile)

          // Create AbortController for timeout handling
          const controller = new AbortController()
          const timeoutId = setTimeout(() => {
            controller.abort()
            console.log('❌ File upload timeout after 10 minutes')
          }, 10 * 60 * 1000) // 10 minutes timeout (longer than server)

          try {
            setUploadProgress(50) // Simulated progress
            const fileResponse = await fetch(`${UPLOAD_BASE_URL}/api/admin/software/${productId}/file`, {
              method: 'POST',
              body: fileFormData,
              signal: controller.signal,
              headers: {
                'Cache-Control': 'no-cache',
                'CF-Cache-Status': 'BYPASS',
              }
            })

            clearTimeout(timeoutId)
            setUploadProgress(100)

            if (!fileResponse.ok) {
              const errorData = await fileResponse.json().catch(() => ({}))
              console.error('File upload failed:', errorData)
              setUploadStatus(`Upload failed: ${errorData.error || 'Unknown error'}`)
              toast.warning(`Product updated but file upload failed: ${errorData.error || 'Unknown error'}. Please try uploading the file again.`)
            } else {
              const fileData = await fileResponse.json()
              console.log(`✅ File uploaded successfully in ${fileData.processingTimeMs || 'unknown'}ms:`, fileData)
              setUploadStatus('File uploaded successfully!')
              toast.success('File uploaded successfully!')
            }
          } catch (error) {
            clearTimeout(timeoutId)
            setUploadProgress(0)
            if (error instanceof Error && error.name === 'AbortError') {
              console.error('❌ File upload timeout')
              setUploadStatus('Upload timeout - please try again')
              toast.error('File upload timeout. Please try with a smaller file or check your connection.')
            } else {
              console.error('❌ File upload error:', error)
              setUploadStatus('Upload failed - please try again')
              toast.warning('Product updated but file upload failed. Please try uploading the file again.')
            }
          }
        }
      } else {
        // Create new product with file upload if downloadFile exists
        if (downloadFile) {
          console.log(`🔄 Creating new product with file: ${downloadFile.name} (${(downloadFile.size / 1024 / 1024).toFixed(2)}MB)`)
          setUploadStatus(`Creating product with file: ${downloadFile.name}...`)
          setUploadProgress(10)

          const uploadFormData = new FormData()
          uploadFormData.append('file', downloadFile)
          uploadFormData.append('name', formData.title)
          uploadFormData.append('version', formData.version)
          uploadFormData.append('category', categories.find(c => c.id === formData.categoryId)?.name || 'Other')
          uploadFormData.append('description', formData.description)
          uploadFormData.append('content', formData.content)
          uploadFormData.append('status', formData.status)

          // Create AbortController for timeout handling
          const controller = new AbortController()
          const timeoutId = setTimeout(() => {
            controller.abort()
            console.log('❌ Product creation with file upload timeout after 10 minutes')
          }, 10 * 60 * 1000) // 10 minutes timeout

          try {
            setUploadProgress(50) // Simulated progress
            const response = await fetch(`${UPLOAD_BASE_URL}/api/admin/software/upload`, {
              method: 'POST',
              body: uploadFormData,
              signal: controller.signal,
              headers: {
                'Cache-Control': 'no-cache',
                'CF-Cache-Status': 'BYPASS',
              }
            })

            clearTimeout(timeoutId)
            setUploadProgress(100)

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}))
              console.error('Product creation with file failed:', errorData)
              setUploadStatus(`Creation failed: ${errorData.message || 'Unknown error'}`)
              throw new Error(errorData.message || 'Failed to create product with file')
            }

            const data = await response.json()
            productId = data.software.id
            console.log(`✅ Product created with file successfully: ${data.software.id}`)
            setUploadStatus('Product with file created successfully!')

          } catch (error) {
            clearTimeout(timeoutId)
            setUploadProgress(0)
            if (error instanceof Error && error.name === 'AbortError') {
              console.error('❌ Product creation timeout')
              setUploadStatus('Creation timeout - please try again')
              throw new Error('Product creation timeout. Please try with a smaller file or check your connection.')
            } else {
              console.error('❌ Product creation error:', error)
              setUploadStatus('Creation failed - please try again')
              throw error
            }
          }
        } else {
          // Create product without file
          const response = await fetch('/api/admin/software', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
          })

          if (!response.ok) throw new Error('Failed to create product')
          const data = await response.json()
          productId = data.product.id
        }
      }

      // Upload images if any (this will ADD to existing images)
      if (selectedImages.length > 0) {
        console.log('Uploading new images to add to existing ones...')
        await uploadImages(productId)
      }

      toast.success(editingSoftware ? 'Product updated successfully' : 'Product created successfully')
      setIsAddDialogOpen(false)
      resetForm()
      fetchSoftware()

    } catch (error) {
      console.error('Submit error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item: Software) => {
    // Set editing software with proper images handling
    let parsedImages: string[] = []
    try {
      if (Array.isArray(item.images)) {
        parsedImages = item.images
      } else if (typeof (item as any).images === 'string') {
        parsedImages = JSON.parse((item as any).images)
      }
    } catch (err) {
      console.error('Failed to parse images in handleEdit:', err)
      parsedImages = []
    }

    const editingItem = {
      ...item,
      images: parsedImages // Ensure images is always an array
    }
    setEditingSoftware(editingItem)

    // Find category ID from category name
    const foundCategory = categories.find(cat => cat.name === item.category)

    setFormData({
      title: item.name,  // API uses 'name'
      slug: item.slug,
      description: item.description || '',
      content: item.content || '',
      version: item.version || '',
      price: item.price.toString(),
      stock: item.stock.toString(),
      status: item.status,
      categoryId: foundCategory?.id || '', // Find category ID from name
      metaTitle: item.metaTitle || '',
      metaDescription: item.metaDescription || '',
      downloadUrl: item.downloadUrl || '',
      externalUrl: item.externalUrl || '',
      requiresKey: item.requiresKey || false,
      adBypassEnabled: item.adBypassEnabled || false,
      freeKeyPlanId: item.freeKeyPlanId || ''
    })

    // Reset selected images for new upload (don't mix with existing)
    setSelectedImages([])
    setIsAddDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this software?')) return

    // Optimistic UI update
    const prevList = software
    setDeletingIds((prev) => new Set(prev).add(id))
    setSoftware((list) => list.filter((s) => s.id !== id))

    try {
      const response = await fetch(`/api/admin/software/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Software deleted successfully')
        // Re-fetch to ensure counters/pagination are correct
        fetchSoftware()
      } else {
        throw new Error('Failed to delete software')
      }
    } catch (error) {
      // Revert on failure
      setSoftware(prevList)
      toast.error('Failed to delete software')
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const copyApiEndpoint = async (id: string) => {
    try {
      const currentIndex = apiTypeIndex[id] || 0
      const apiType = apiTypes[currentIndex]
      const baseUrl = window.location.origin
      const endpoint = `${baseUrl}/api/products/${id}${apiType.path}`

      await navigator.clipboard.writeText(endpoint)
      toast.success(`${apiType.label} copied!`)

      // Cycle to next API type
      const nextIndex = (currentIndex + 1) % apiTypes.length
      setApiTypeIndex(prev => ({ ...prev, [id]: nextIndex }))
    } catch (error) {
      toast.error('Failed to copy API endpoint')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Software Management</h1>
          <p className="text-muted-foreground">Manage your software products and downloads</p>
        </div>
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Software
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSoftware ? 'Edit Software' : 'Add New Software'}
              </DialogTitle>
              <DialogDescription>
                {editingSoftware ? 'Update software information, images, and settings.' : 'Create a new software product with details, images, and download options.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="media">Media</TabsTrigger>
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                  <TabsTrigger value="key-settings">Key Settings</TabsTrigger>
                </TabsList>

                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => {
                          const title = e.target.value
                          setFormData({
                            ...formData,
                            title,
                            slug: generateSlug(title)
                          })
                        }}
                        placeholder="Software title"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug *</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="software-slug"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="version">Version</Label>
                      <Input
                        id="version"
                        value={formData.version}
                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                        placeholder="1.0.0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="categoryId">Category *</Label>
                      <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Price (VND)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0"
                        min="0"
                        step="1000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stock">Stock</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        placeholder="9999"
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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
                </TabsContent>

                {/* Content Tab */}
                <TabsContent value="content" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">Short Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description of the software"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">Full Content</Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="Detailed content and features..."
                        rows={8}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="downloadUrl">Download URL</Label>
                      <Input
                        id="downloadUrl"
                        value={formData.downloadUrl}
                        onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                        placeholder="https://example.com/download"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="externalUrl">External URL (App Store, etc.)</Label>
                      <Input
                        id="externalUrl"
                        value={formData.externalUrl}
                        onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                        placeholder="https://play.google.com/store/apps/details?id=..."
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Media Tab */}
                <TabsContent value="media" className="space-y-4">
                  {/* Image Upload */}
                  <div className="space-y-4">
                    <div>
                      <Label>Product Images</Label>
                      <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6">
                        <div className="text-center">
                          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="mt-4">
                            <label htmlFor="images" className="cursor-pointer">
                              <span className="mt-2 block text-sm font-medium text-gray-900">
                                Upload product images
                              </span>
                              <input
                                id="images"
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                              />
                            </label>
                          </div>
                          <p className="mt-2 text-sm text-gray-500">
                            PNG, JPG, WebP up to 5MB each. Max 10 images.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Selected Images Preview */}
                    {selectedImages.length > 0 && (
                      <div>
                        <Label>Selected Images ({selectedImages.length}/10)</Label>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                          {selectedImages.map((file, index) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-20 object-cover rounded-lg"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                className="absolute -top-2 -right-2 h-6 w-6 p-0"
                                onClick={() => removeSelectedImage(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Current Images for Edit Mode */}
                    {editingSoftware && (() => {
                      // Safely parse images from JSON or array
                      let currentImages: string[] = []
                      try {
                        if (editingSoftware.images) {
                          if (Array.isArray(editingSoftware.images)) {
                            currentImages = editingSoftware.images
                          } else if (typeof editingSoftware.images === 'string') {
                            currentImages = JSON.parse(editingSoftware.images)
                          }
                        }
                      } catch (error) {
                        console.error('Error parsing current images:', error)
                      }

                      return currentImages.length > 0 ? (
                        <div>
                          <Label>Current Images</Label>
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                            {currentImages.map((imageUrl, index) => {
                              // Convert to API URL format if needed  
                              const apiImageUrl = getImageUrl(imageUrl)

                              return (
                                <div key={index} className="relative">
                                  <img
                                    src={apiImageUrl}
                                    alt={`Current ${index + 1}`}
                                    className="w-full h-20 object-cover rounded-lg"
                                    onError={(e) => {
                                      console.error('Image load error:', apiImageUrl)
                                      e.currentTarget.src = '/placeholder-image.svg'
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    className="absolute -top-2 -right-2 h-6 w-6 p-0"
                                    onClick={() => removeCurrentImage(index, imageUrl)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              )
                            })}
                          </div>
                          <p className="mt-2 text-sm text-gray-500">
                            Click X to remove images. Changes will be saved when you update the product.
                          </p>
                        </div>
                      ) : null
                    })()}

                    {/* Download File Upload */}
                    <div>
                      <Label>Download File (for new products)</Label>
                      <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6">
                        <div className="text-center">
                          <File className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="mt-4">
                            <label htmlFor="downloadFile" className="cursor-pointer">
                              <span className="mt-2 block text-sm font-medium text-gray-900">
                                Upload software file
                              </span>
                              <input
                                id="downloadFile"
                                type="file"
                                accept=".exe,.msi,.zip,.rar,.7z"
                                onChange={handleDownloadFileSelect}
                                className="hidden"
                              />
                            </label>
                          </div>
                          <p className="mt-2 text-sm text-gray-500">
                            EXE, MSI, ZIP, RAR, 7Z up to 100MB
                          </p>
                        </div>
                        {downloadFile && (
                          <div className="mt-4 text-sm text-gray-600">
                            Selected: {downloadFile.name} ({(downloadFile.size / 1024 / 1024).toFixed(2)} MB)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* SEO Tab */}
                <TabsContent value="seo" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="metaTitle">Meta Title</Label>
                      <Input
                        id="metaTitle"
                        value={formData.metaTitle}
                        onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                        placeholder="SEO title for search engines"
                        maxLength={60}
                      />
                      <p className="text-xs text-muted-foreground">
                        {formData.metaTitle.length}/60 characters
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="metaDescription">Meta Description</Label>
                      <Textarea
                        id="metaDescription"
                        value={formData.metaDescription}
                        onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                        placeholder="SEO description for search engines"
                        rows={3}
                        maxLength={160}
                      />
                      <p className="text-xs text-muted-foreground">
                        {formData.metaDescription.length}/160 characters
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* Key Settings Tab */}
                <TabsContent value="key-settings" className="space-y-4">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <Label className="font-medium">Requires License Key</Label>
                        <p className="text-sm text-muted-foreground">
                          Người dùng cần key để sử dụng sản phẩm này
                        </p>
                      </div>
                      <Switch
                        checked={formData.requiresKey}
                        onCheckedChange={(checked) => setFormData({ ...formData, requiresKey: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <Label className="font-medium">Ad Bypass for Download</Label>
                        <p className="text-sm text-muted-foreground">
                          Bật vượt quảng cáo để tải xuống (dùng khi không cần key)
                        </p>
                      </div>
                      <Switch
                        checked={formData.adBypassEnabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, adBypassEnabled: checked })}
                      />
                    </div>

                    {formData.requiresKey && (
                      <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                        <Label htmlFor="freeKeyPlanId">Free Key Plan</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Chọn plan cho free key 4 tiếng (Get Key Free)
                        </p>
                        <Select
                          value={formData.freeKeyPlanId || 'none'}
                          onValueChange={(value) => setFormData({ ...formData, freeKeyPlanId: value === 'none' ? '' : value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select free key plan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No free key</SelectItem>
                            {subscriptionPlans.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Key className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">Get Key Free Feature</p>
                          <p className="text-sm text-blue-700 mt-1">
                            Khi bật "Requires License Key" và chọn Free Key Plan, người dùng sẽ thấy nút "Get Key Free"
                            trên trang sản phẩm. Họ có thể vượt quảng cáo YeuMoney để nhận key miễn phí 4 tiếng.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || uploadingImages}>
                  {loading
                    ? (uploadingImages ? 'Uploading images...' : 'Saving...')
                    : editingSoftware ? 'Update' : 'Create'
                  }
                </Button>
              </div>

              {/* Upload Progress Indicator */}
              {(uploadStatus || uploadProgress > 0) && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">
                      {uploadStatus || 'Processing...'}
                    </span>
                    {uploadProgress > 0 && (
                      <span className="text-sm text-blue-600">
                        {uploadProgress}%
                      </span>
                    )}
                  </div>
                  {uploadProgress > 0 && (
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                  <p className="text-xs text-blue-600 mt-2">
                    Large files may take several minutes to upload. Please wait...
                  </p>
                </div>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search software..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Software List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Software Products ({software.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : software.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No software found. Add your first product!
            </div>
          ) : (
            <div className="space-y-4">
              {software.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
                      {/* Product Image */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {(() => {
                          // Safely parse images
                          let imageUrls: string[] = []
                          try {
                            if (item.images) {
                              if (Array.isArray(item.images)) {
                                imageUrls = item.images
                              } else if (typeof item.images === 'string') {
                                imageUrls = JSON.parse(item.images)
                              }
                            }
                          } catch (error) {
                            console.error('Error parsing images for listing:', error)
                          }

                          return imageUrls.length > 0 ? (
                            <img
                              src={getImageUrl(imageUrls[0])}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                e.currentTarget.nextElementSibling?.classList.remove('hidden')
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )
                        })()}
                        {/* Fallback icon for broken images */}
                        <div className="w-full h-full flex items-center justify-center hidden">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {item.category} • {item.version}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.description?.slice(0, 100)}...
                            </p>
                          </div>

                          <div className="flex gap-2 ml-4">
                            <Badge variant={item.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                              {item.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Download className="h-4 w-4" />
                            {item.downloads} downloads
                          </span>
                          <span>{item.totalReviews} reviews</span>
                          <span>₫{item.price.toLocaleString()}</span>
                          {(item.downloadUrl || item.externalUrl) && (
                            <Badge variant="outline" className="text-green-600">
                              Download Available
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyApiEndpoint(item.id)}
                        title={`Copy ${apiTypes[apiTypeIndex[item.id] || 0].label}`}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => window.open(`/products/${item.slug}`, '_blank')}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

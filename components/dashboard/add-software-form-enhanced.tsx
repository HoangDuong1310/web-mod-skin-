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
import { Upload, X, FileText, Image as ImageIcon, File, Copy } from 'lucide-react'

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
  const [uploadProgress, setUploadProgress] = useState<{file?: number, images?: number}>({})
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
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
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'title' && { slug: generateSlug(value) })
    }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setSelectedImages(prev => [...prev, ...files])
      
      // Create preview URLs
      files.forEach(file => {
        const reader = new FileReader()
        reader.onload = (e) => {
          setImagePreviewUrls(prev => [...prev, e.target?.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
  }

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  const copyApiEndpoints = () => {
    const endpoints = [
      'GET /api/admin/software',
      'POST /api/admin/software',
      'GET /api/admin/software/[id]',
      'PUT /api/admin/software/[id]',
      'DELETE /api/admin/software/[id]',
      'POST /api/admin/products/[id]/images'
    ]
    
    navigator.clipboard.writeText(endpoints.join('\n')).then(() => {
      toast.success('API endpoints copied to clipboard!')
    }).catch(() => {
      toast.error('Failed to copy API endpoints')
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.version.trim() || !formData.categoryId) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      // Create product first
      const productResponse = await fetch('/api/admin/software', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!productResponse.ok) {
        throw new Error('Failed to create product')
      }

      const product = await productResponse.json()
      const productId = product.id

      // Upload software file if selected
      if (selectedFile) {
        console.log(`🔄 Starting file upload: ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)}MB)`)
        setUploadStatus('Uploading file...')
        setUploadProgress({file: 0})
        
        const fileData = new FormData()
        fileData.append('file', selectedFile)
        
        // Create AbortController for timeout handling
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          controller.abort()
          console.log('❌ File upload timeout after 5 minutes')
        }, 5 * 60 * 1000) // 5 minutes timeout
        
        try {
          setUploadProgress({file: 50}) // Simulated progress since we can't track real progress easily
          const fileResponse = await fetch(`/api/admin/software/${productId}/file`, {
            method: 'POST',
            body: fileData,
            signal: controller.signal
          })

          clearTimeout(timeoutId)
          setUploadProgress({file: 100})

          if (!fileResponse.ok) {
            const errorData = await fileResponse.json().catch(() => ({}))
            console.error('File upload failed:', errorData)
            toast.error(`File upload failed: ${errorData.error || 'Unknown error'}`)
          } else {
            const result = await fileResponse.json()
            console.log(`✅ File upload successful in ${result.processingTimeMs}ms`)
            toast.success('File uploaded successfully!')
            setUploadStatus('File upload completed!')
          }
        } catch (error) {
          clearTimeout(timeoutId)
          setUploadProgress({})
          if (error instanceof Error && error.name === 'AbortError') {
            console.error('❌ File upload timeout')
            setUploadStatus('Upload timeout - please try again with a smaller file')
            toast.error('File upload timeout. Please try with a smaller file or check your connection.')
          } else {
            console.error('❌ File upload error:', error)
            setUploadStatus('Upload failed - please try again')
            toast.error('File upload failed. Please try again.')
          }
        }
      }

      // Upload images if selected
      if (selectedImages.length > 0) {
        const imageData = new FormData()
        selectedImages.forEach(image => {
          imageData.append('images', image)
        })

        const imageResponse = await fetch(`/api/admin/products/${productId}/images`, {
          method: 'POST',
          body: imageData,
        })

        if (!imageResponse.ok) {
          console.warn('Image upload failed, but product created')
        }
      }

      toast.success('Software added successfully!')
      
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
      setSelectedImages([])
      setImagePreviewUrls([])

      if (onSuccess) {
        onSuccess()
      }

    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Failed to add software')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Add New Software</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={copyApiEndpoints}
          className="flex items-center gap-2"
        >
          <Copy className="h-4 w-4" />
          Copy API
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Software name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      placeholder="url-friendly-name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="version">Version *</Label>
                    <Input
                      id="version"
                      value={formData.version}
                      onChange={(e) => handleInputChange('version', e.target.value)}
                      placeholder="1.0.0"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoryId">Category *</Label>
                    <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
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
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock">Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) => handleInputChange('stock', e.target.value)}
                      placeholder="9999"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value as 'PUBLISHED' | 'DRAFT')}>
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

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of the software"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="downloadUrl">Download URL</Label>
                    <Input
                      id="downloadUrl"
                      value={formData.downloadUrl}
                      onChange={(e) => handleInputChange('downloadUrl', e.target.value)}
                      placeholder="https://example.com/download"
                    />
                  </div>
                  <div>
                    <Label htmlFor="externalUrl">External URL</Label>
                    <Input
                      id="externalUrl"
                      value={formData.externalUrl}
                      onChange={(e) => handleInputChange('externalUrl', e.target.value)}
                      placeholder="https://example.com/info"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div>
                  <Label htmlFor="content">Detailed Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="Detailed description, features, system requirements, etc."
                    rows={10}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Software File Upload */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Software File
                  </h3>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <input
                      type="file"
                      id="software-file"
                      onChange={handleFileSelect}
                      accept=".exe,.msi,.zip,.rar,.7z,.tar.gz,.deb,.rpm,.dmg,.pkg"
                      className="hidden"
                    />
                    <label
                      htmlFor="software-file"
                      className="cursor-pointer flex flex-col items-center justify-center"
                    >
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 text-center">
                        Click to upload software file
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Supported: EXE, MSI, ZIP, RAR, etc.
                      </p>
                    </label>
                  </div>

                  {selectedFile && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4 text-blue-600" />
                        <span className="text-sm truncate">{selectedFile.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Images Upload */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Product Images
                  </h3>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <input
                      type="file"
                      id="product-images"
                      onChange={handleImageSelect}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                    <label
                      htmlFor="product-images"
                      className="cursor-pointer flex flex-col items-center justify-center"
                    >
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 text-center">
                        Click to upload images
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG, WebP (Max 5MB each)
                      </p>
                    </label>
                  </div>

                  {selectedImages.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {selectedImages.map((image, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4 text-green-600" />
                            <span className="text-sm truncate">{image.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(image.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {imagePreviewUrls.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {imagePreviewUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle}
                    onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                    placeholder="SEO title (leave empty to use product title)"
                    maxLength={60}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.metaTitle.length}/60 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={formData.metaDescription}
                    onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                    placeholder="SEO description (leave empty to use product description)"
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.metaDescription.length}/160 characters
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-4 mt-6">
          <Button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Software'}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>

        {/* Upload Progress Indicator */}
        {(uploadStatus || uploadProgress.file !== undefined) && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">
                {uploadStatus || 'Uploading...'}
              </span>
              {uploadProgress.file !== undefined && (
                <span className="text-sm text-blue-600">
                  {uploadProgress.file}%
                </span>
              )}
            </div>
            {uploadProgress.file !== undefined && (
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{width: `${uploadProgress.file}%`}}
                />
              </div>
            )}
            <p className="text-xs text-blue-600 mt-2">
              Large files may take several minutes to upload. Please wait...
            </p>
          </div>
        )}
      </form>
    </div>
  )
}

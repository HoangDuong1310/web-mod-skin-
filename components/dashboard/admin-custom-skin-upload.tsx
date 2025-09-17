'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { 
  Upload, 
  File, 
  X, 
  AlertCircle, 
  CheckCircle,
  Image as ImageIcon,
  Loader2,
  Save,
  ArrowLeft
} from 'lucide-react'

interface Champion {
  id: number
  name: string
  alias: string
}

interface Category {
  id: string
  name: string
  slug: string
}

interface FormData {
  name: string
  description: string
  version: string
  championId: string
  categoryId: string
  status: 'APPROVED' | 'FEATURED' | 'HIDDEN'
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_FILE_TYPES = ['.zip', '.rar', '.fantome']
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export default function AdminCustomSkinUpload() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [champions, setChampions] = useState<Champion[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  
  // Form data
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    version: '1.0',
    championId: '',
    categoryId: '',
    status: 'APPROVED'
  })
  
  // File states
  const [skinFile, setSkinFile] = useState<File | null>(null)
  const [previewImages, setPreviewImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  
  // Error states
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Fetch reference data
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const [championsRes, categoriesRes] = await Promise.all([
          fetch('/api/champions'),
          fetch('/api/custom-skins/categories')
        ])
        
        if (championsRes.ok) {
          const championsData = await championsRes.json()
          setChampions(championsData.champions || [])
        }
        
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData.categories || [])
        }
      } catch (error) {
        console.error('Error fetching reference data:', error)
        toast.error('Không thể tải dữ liệu tham chiếu')
      }
    }
    
    fetchReferenceData()
  }, [])
  
  // Handle skin file change
  const handleSkinFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ACCEPTED_FILE_TYPES.includes(fileExtension)) {
      setErrors(prev => ({ 
        ...prev, 
        skinFile: `Chỉ chấp nhận các định dạng: ${ACCEPTED_FILE_TYPES.join(', ')}` 
      }))
      return
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setErrors(prev => ({ 
        ...prev, 
        skinFile: 'Kích thước file không được vượt quá 50MB' 
      }))
      return
    }
    
    setErrors(prev => ({ ...prev, skinFile: '' }))
    setSkinFile(file)
  }
  
  // Handle preview images change
  const handlePreviewImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    // Validate total count
    if (previewImages.length + files.length > 5) {
      setErrors(prev => ({ 
        ...prev, 
        previewImages: 'Tối đa 5 ảnh preview' 
      }))
      return
    }
    
    // Validate each file
    const validFiles: File[] = []
    const newUrls: string[] = []
    
    for (const file of files) {
      // Check type
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error(`File ${file.name} không phải là ảnh hợp lệ`)
        continue
      }
      
      // Check size
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`File ${file.name} vượt quá 5MB`)
        continue
      }
      
      validFiles.push(file)
      newUrls.push(URL.createObjectURL(file))
    }
    
    setErrors(prev => ({ ...prev, previewImages: '' }))
    setPreviewImages(prev => [...prev, ...validFiles])
    setPreviewUrls(prev => [...prev, ...newUrls])
  }
  
  // Remove preview image
  const removePreviewImage = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => {
      // Revoke object URL to free memory
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Tên skin không được để trống'
    } else if (formData.name.length < 3) {
      newErrors.name = 'Tên skin phải có ít nhất 3 ký tự'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Mô tả không được để trống'
    } else if (formData.description.length < 10) {
      newErrors.description = 'Mô tả phải có ít nhất 10 ký tự'
    }
    
    if (!formData.version.trim()) {
      newErrors.version = 'Phiên bản không được để trống'
    }
    
    if (!formData.championId) {
      newErrors.championId = 'Vui lòng chọn tướng'
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Vui lòng chọn danh mục'
    }
    
    if (!skinFile) {
      newErrors.skinFile = 'Vui lòng chọn file skin'
    }
    
    if (previewImages.length === 0) {
      newErrors.previewImages = 'Vui lòng tải lên ít nhất 1 ảnh preview'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin')
      return
    }
    
    setLoading(true)
    setUploadProgress(0)
    
    try {
      // Step 1: Upload skin file
      const skinFormData = new FormData()
      skinFormData.append('file', skinFile!)
      skinFormData.append('type', 'skin')
      
      setUploadProgress(10)
      
      const skinUploadRes = await fetch('/api/admin/custom-skins/upload', {
        method: 'POST',
        body: skinFormData
      })
      
      if (!skinUploadRes.ok) {
        throw new Error('Không thể upload file skin')
      }
      
      const { filePath: skinFilePath, fileName: skinFileName } = await skinUploadRes.json()
      setUploadProgress(40)
      
      // Step 2: Upload preview images
      const uploadedPreviewImages: string[] = []
      let thumbnailImage: string | null = null
      
      for (let i = 0; i < previewImages.length; i++) {
        const imageFormData = new FormData()
        imageFormData.append('file', previewImages[i])
        imageFormData.append('type', 'preview')
        
        const imageUploadRes = await fetch('/api/admin/custom-skins/upload', {
          method: 'POST',
          body: imageFormData
        })
        
        if (imageUploadRes.ok) {
          const { filePath } = await imageUploadRes.json()
          uploadedPreviewImages.push(filePath)
          
          // Use first image as thumbnail
          if (i === 0) {
            thumbnailImage = filePath
          }
        }
        
        setUploadProgress(40 + ((i + 1) / previewImages.length) * 30)
      }
      
      // Step 3: Create custom skin record
      setUploadProgress(80)
      
      const createSkinRes = await fetch('/api/admin/custom-skins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          championId: parseInt(formData.championId),
          fileName: skinFileName,
          filePath: skinFilePath,
          fileSize: skinFile!.size.toString(),
          fileType: skinFile!.name.split('.').pop()?.toUpperCase() || 'ZIP',
          previewImages: uploadedPreviewImages,
          thumbnailImage
        })
      })
      
      if (!createSkinRes.ok) {
        throw new Error('Không thể tạo custom skin')
      }
      
      setUploadProgress(100)
      
      const result = await createSkinRes.json()
      
      toast.success('Đã thêm custom skin thành công!')
      
      // Redirect to approved skins page
      setTimeout(() => {
        router.push('/dashboard/custom-skins/approved')
      }, 1500)
      
    } catch (error) {
      console.error('Error creating custom skin:', error)
      toast.error(error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tạo custom skin')
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Thêm Custom Skin Mới</h1>
          <p className="text-muted-foreground">Upload và thêm custom skin vào hệ thống</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
      </div>
      
      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
              <CardDescription>
                Nhập thông tin chi tiết về custom skin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên skin *</Label>
                <Input
                  id="name"
                  placeholder="VD: Dark Star Yasuo"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={loading}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả *</Label>
                <Textarea
                  id="description"
                  placeholder="Mô tả chi tiết về skin..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  disabled={loading}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="version">Phiên bản *</Label>
                <Input
                  id="version"
                  placeholder="VD: 1.0"
                  value={formData.version}
                  onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                  disabled={loading}
                />
                {errors.version && (
                  <p className="text-sm text-destructive">{errors.version}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="champion">Tướng *</Label>
                  <Select 
                    value={formData.championId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, championId: value }))}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn tướng" />
                    </SelectTrigger>
                    <SelectContent>
                      {champions.map(champion => (
                        <SelectItem key={champion.id} value={champion.id.toString()}>
                          {champion.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.championId && (
                    <p className="text-sm text-destructive">{errors.championId}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Danh mục *</Label>
                  <Select 
                    value={formData.categoryId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && (
                    <p className="text-sm text-destructive">{errors.categoryId}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Trạng thái *</Label>
                <RadioGroup 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as typeof formData.status }))}
                  disabled={loading}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="APPROVED" id="approved" />
                    <Label htmlFor="approved">Đã duyệt</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="FEATURED" id="featured" />
                    <Label htmlFor="featured">Nổi bật</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="HIDDEN" id="hidden" />
                    <Label htmlFor="hidden">Ẩn</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
          
          {/* File Upload */}
          <div className="space-y-6">
            {/* Skin File */}
            <Card>
              <CardHeader>
                <CardTitle>File Skin</CardTitle>
                <CardDescription>
                  Upload file skin (.zip, .rar, .fantome) - Tối đa 50MB
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted rounded-lg p-6">
                    <input
                      type="file"
                      id="skinFile"
                      accept={ACCEPTED_FILE_TYPES.join(',')}
                      onChange={handleSkinFileChange}
                      className="hidden"
                      disabled={loading}
                    />
                    <label 
                      htmlFor="skinFile" 
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Nhấp để chọn file hoặc kéo thả vào đây
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {ACCEPTED_FILE_TYPES.join(', ')} (Tối đa 50MB)
                      </p>
                    </label>
                  </div>
                  
                  {skinFile && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{skinFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(skinFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSkinFile(null)}
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {errors.skinFile && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.skinFile}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Preview Images */}
            <Card>
              <CardHeader>
                <CardTitle>Ảnh Preview</CardTitle>
                <CardDescription>
                  Upload ảnh preview (Tối đa 5 ảnh, mỗi ảnh tối đa 5MB)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted rounded-lg p-6">
                    <input
                      type="file"
                      id="previewImages"
                      accept={ACCEPTED_IMAGE_TYPES.join(',')}
                      multiple
                      onChange={handlePreviewImagesChange}
                      className="hidden"
                      disabled={loading || previewImages.length >= 5}
                    />
                    <label 
                      htmlFor="previewImages" 
                      className={`flex flex-col items-center justify-center ${
                        previewImages.length >= 5 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                      }`}
                    >
                      <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Nhấp để chọn ảnh hoặc kéo thả vào đây
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG, WebP (Tối đa 5MB mỗi ảnh)
                      </p>
                    </label>
                  </div>
                  
                  {previewUrls.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-video relative overflow-hidden rounded-lg border">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removePreviewImage(index)}
                            disabled={loading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          {index === 0 && (
                            <div className="absolute top-2 left-2">
                              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                                Thumbnail
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {errors.previewImages && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.previewImages}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Upload Progress */}
        {loading && uploadProgress > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Đang upload...</span>
                  <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Thêm Custom Skin
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
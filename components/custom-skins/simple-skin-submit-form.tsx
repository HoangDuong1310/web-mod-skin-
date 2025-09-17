'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import {
  Upload,
  X,
  AlertTriangle,
  Check,
  Loader2,
  Image as ImageIcon,
  File,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

const submitSchema = z.object({
  name: z.string().min(3, 'Tên skin phải có ít nhất 3 ký tự').max(100, 'Tên skin không được vượt quá 100 ký tự'),
  description: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự').max(1000, 'Mô tả không được vượt quá 1000 ký tự'),
  championId: z.coerce.string().min(1, 'Vui lòng chọn tướng'),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
  version: z.string().min(1, 'Phiên bản là bắt buộc').max(20, 'Phiên bản không được vượt quá 20 ký tự'),
  tags: z.string().optional(),
  websiteUrl: z.string().url('Phải là URL hợp lệ').optional().or(z.literal('')),
  youtubeUrl: z.string().url('Phải là URL YouTube hợp lệ').optional().or(z.literal(''))
})

type SubmitFormData = z.infer<typeof submitSchema>

interface Champion {
  id: number
  name: string
  alias: string
  squarePortraitPath?: string
}

interface Category {
  id: string
  name: string
  description?: string
}

export function SimpleSkinSubmitForm() {
  const { data: session } = useSession()
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewImages, setPreviewImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [champions, setChampions] = useState<Champion[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  
  const skinFileInputRef = useRef<HTMLInputElement>(null)
  const previewInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<SubmitFormData>({
    resolver: zodResolver(submitSchema),
    defaultValues: {
      name: '',
      description: '',
      championId: '',
      categoryId: '',
      version: '1.0',
      tags: '',
      websiteUrl: '',
      youtubeUrl: ''
    }
  })

  // Load champions and categories
  useEffect(() => {
    const loadData = async () => {
      try {
        const [championsRes, categoriesRes] = await Promise.all([
          fetch('/api/champions'),
          fetch('/api/custom-skins/categories')
        ])

        if (championsRes.ok) {
          const championsData = await championsRes.json()
          // API trả về { champions: [...] } format
          setChampions(championsData.champions || championsData)
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData.categories || categoriesData)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    loadData()
  }, [])

  const validateAndSetFile = useCallback((file: File) => {
    const allowedTypes = ['.zip', '.rar', '.fantome']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!allowedTypes.includes(fileExtension)) {
      toast.error(`File type not supported. Allowed: ${allowedTypes.join(', ')}`)
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB')
      return
    }

    setSelectedFile(file)
    toast.success('Skin file uploaded successfully!')
  }, [])

  const validateAndSetPreviewImages = useCallback((files: File[]) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxFiles = 5
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} preview images allowed`)
      return
    }

    const validFiles: File[] = []
    const newUrls: string[] = []

    files.forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Invalid image type`)
        return
      }

      if (file.size > maxSize) {
        toast.error(`${file.name}: Image too large (max 5MB)`)
        return
      }

      validFiles.push(file)
      newUrls.push(URL.createObjectURL(file))
    })

    if (validFiles.length > 0) {
      setPreviewImages(prev => [...prev, ...validFiles])
      setPreviewUrls(prev => [...prev, ...newUrls])
      toast.success(`${validFiles.length} preview images added!`)
    }
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const handlePreviewSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      validateAndSetPreviewImages(files)
    }
  }

  const removePreviewImage = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => {
      const newUrls = prev.filter((_, i) => i !== index)
      URL.revokeObjectURL(prev[index]) // Clean up memory
      return newUrls
    })
  }

  const onSubmit = async (data: SubmitFormData) => {
    if (!selectedFile) {
      toast.error('Please select a skin file to upload')
      return
    }

    if (previewImages.length === 0) {
      toast.error('Please upload at least one preview image')
      return
    }

    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      
      // Add form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value)
      })
      
      // Add main file
      formData.append('skinFile', selectedFile)
      
      // Add preview images
      previewImages.forEach((image, index) => {
        formData.append(`previewImage_${index}`, image)
      })

      // Submit form
      const response = await fetch('/api/skin-submissions', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const result = await response.json()
      
      toast.success('Skin submitted successfully! It will be reviewed by our team.')
      router.push('/custom-skins')
      
    } catch (error) {
      console.error('Submission error:', error)
      toast.error(error instanceof Error ? error.message : 'Submission failed')
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  if (!session) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
            <h2 className="text-xl font-semibold">Authentication Required</h2>
            <p className="text-muted-foreground">
              You need to be logged in to submit custom skins.
            </p>
            <Button onClick={() => router.push('/auth/signin')}>
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Share Your Creativity</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">Submit Custom Skin</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Share your amazing custom skin with the community. Fill out the form below to submit your creation.
          </p>
        </motion.div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Submit Your Custom Skin</CardTitle>
                <CardDescription>
                  Fill out all required information to submit your skin for review.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Skin Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skin Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter skin name..."
                          {...field}
                          className="text-base"
                        />
                      </FormControl>
                      <FormDescription>
                        Choose a unique and descriptive name for your skin
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Champion and Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="championId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Champion *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select champion" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {champions && champions.length > 0 ? champions.map((champion) => (
                              <SelectItem key={champion.id} value={champion.id.toString()}>
                                {champion.name}
                              </SelectItem>
                            )) : (
                              <SelectItem value="loading" disabled>Loading champions...</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories && categories.length > 0 ? categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            )) : (
                              <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Version */}
                <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Version *</FormLabel>
                      <FormControl>
                        <Input placeholder="1.0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your skin in detail..."
                          className="min-h-[120px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a detailed description of your skin ({field.value?.length || 0}/1000)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Skin File Upload */}
                <div className="space-y-4">
                  <Label>Skin File *</Label>
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer hover:border-primary/50",
                      selectedFile ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-muted-foreground/25"
                    )}
                    onClick={() => skinFileInputRef.current?.click()}
                  >
                    <input
                      ref={skinFileInputRef}
                      type="file"
                      accept=".zip,.rar,.fantome"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    {selectedFile ? (
                      <div className="space-y-2">
                        <Check className="w-12 h-12 text-green-500 mx-auto" />
                        <p className="font-medium text-green-700 dark:text-green-400">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <File className="w-12 h-12 text-muted-foreground mx-auto" />
                        <div>
                          <p className="font-medium">Click to upload skin file</p>
                          <p className="text-sm text-muted-foreground">
                            Supports .zip, .rar, .fantome files (max 50MB)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview Images */}
                <div className="space-y-4">
                  <Label>Preview Images * (1-5 images)</Label>
                  
                  {/* Upload Area */}
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer hover:border-primary/50"
                    onClick={() => previewInputRef.current?.click()}
                  >
                    <input
                      ref={previewInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePreviewSelect}
                      className="hidden"
                    />
                    <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="font-medium">Click to add preview images</p>
                    <p className="text-sm text-muted-foreground">
                      PNG, JPG, WEBP up to 5MB each
                    </p>
                  </div>

                  {/* Preview Grid */}
                  {previewUrls.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {previewUrls.map((url, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative group aspect-video rounded-lg overflow-hidden"
                        >
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/default-skin.svg'
                          }}
                        />
                          <button
                            type="button"
                            onClick={() => removePreviewImage(index)}
                            className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upload Progress */}
                {isSubmitting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}
              </CardContent>

              {/* Submit Button */}
              <div className="p-6 border-t">
                <Button
                  type="submit"
                  disabled={isSubmitting || !selectedFile || previewImages.length === 0}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Submit Skin
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  )
}

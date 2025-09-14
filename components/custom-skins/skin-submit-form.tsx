'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import React from 'react'
import { Loader2, Upload, X, AlertTriangle, Check, Search, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'



const submitSchema = z.object({
  name: z.string().min(3, 'Skin name must be at least 3 characters').max(100, 'Skin name must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must be less than 1000 characters'),
  championId: z.coerce.string().min(1, 'Please select a champion'), // Convert number to string
  categoryId: z.string().min(1, 'Please select a category'),
  version: z.string().min(1, 'Version is required').max(20, 'Version must be less than 20 characters'),
  tags: z.string().optional(),
  downloadUrl: z.string().optional(),
  websiteUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  youtubeUrl: z.string().url('Must be a valid YouTube URL').optional().or(z.literal(''))
})

type SubmitFormData = z.infer<typeof submitSchema>

interface Champion {
  id: number  // Changed from string to number to match database
  name: string
  alias: string
}

interface Category {
  id: string
  name: string
}

export default function SkinSubmitForm() {
  const { data: session } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewInputRef = useRef<HTMLInputElement>(null)

  const [champions, setChampions] = useState<Champion[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewImages, setPreviewImages] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [championSearchQuery, setChampionSearchQuery] = useState('')
  const [showChampionDropdown, setShowChampionDropdown] = useState(false)
  
  // Drag & Drop states
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const [isPreviewDragOver, setIsPreviewDragOver] = useState(false)
  const [previewDragCounter, setPreviewDragCounter] = useState(0)

  const form = useForm<SubmitFormData>({
    resolver: zodResolver(submitSchema),
    defaultValues: {
      name: '',
      description: '',
      championId: '',
      categoryId: '',
      version: '1.0',
      tags: '',
      downloadUrl: '',
      websiteUrl: '',
      youtubeUrl: ''
    }
  })

  // Load champions and categories
  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [championsRes, categoriesRes] = await Promise.all([
          fetch('/api/champions'),
          fetch('/api/skin-categories')
        ])

        if (championsRes.ok) {
          const championsData = await championsRes.json()
          setChampions(Array.isArray(championsData) ? championsData : championsData.champions || [])
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData.categories || [])
        }
      } catch (error) {
        console.error('Failed to load data:', error)
        toast.error('Failed to load champions and categories')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (target && !target.closest('.champion-selector')) {
        setShowChampionDropdown(false)
      }
    }

    if (showChampionDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showChampionDropdown])

  // Filter champions based on search query
  const filteredChampions = champions.filter(champion => {
    const query = championSearchQuery?.toLowerCase() || ''
    const name = champion?.name?.toLowerCase() || ''
    const alias = champion?.alias?.toLowerCase() || ''
    return name.includes(query) || alias.includes(query)
  })

  const getSelectedChampionName = (championId: string) => {
    const champion = champions.find(c => c?.id === parseInt(championId)) // Convert string to number for comparison
    return champion ? `${champion.name || ''}` : ''
  }

  // Drag & Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(prev => prev + 1)
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(prev => prev - 1)
    if (dragCounter <= 1) {
      setIsDragOver(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    setDragCounter(0)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      validateAndSetFile(file)
    }
  }

  const validateAndSetFile = (file: File) => {
    // Validate file type
    const allowedTypes = ['.zip', '.rar', '.fantome']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!allowedTypes.includes(fileExtension)) {
      toast.error(`Invalid file type. Please select a ${allowedTypes.join(', ')} file.`)
      return
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 100MB')
      return
    }

    setSelectedFile(file)
    toast.success(`Selected: ${file.name}`)
  }

  // Preview Images Drag & Drop handlers
  const handlePreviewDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPreviewDragCounter(prev => prev + 1)
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsPreviewDragOver(true)
    }
  }

  const handlePreviewDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPreviewDragCounter(prev => prev - 1)
    if (previewDragCounter <= 1) {
      setIsPreviewDragOver(false)
    }
  }

  const handlePreviewDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handlePreviewDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsPreviewDragOver(false)
    setPreviewDragCounter(0)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      validateAndSetPreviewImages(files)
    }
  }

  const validateAndSetPreviewImages = (files: File[]) => {
    // Validate image files
    const validImages = files.filter(file => {
      const isImage = file.type.startsWith('image/')
      const isValidSize = file.size <= 5 * 1024 * 1024 // 5MB
      
      if (!isImage) {
        toast.error(`${file.name} is not a valid image file`)
        return false
      }
      
      if (!isValidSize) {
        toast.error(`${file.name} must be less than 5MB`)
        return false
      }
      
      return true
    })

    // Limit to 5 images
    if (previewImages.length + validImages.length > 5) {
      toast.error('You can upload up to 5 preview images')
      return
    }

    setPreviewImages(prev => [...prev, ...validImages])
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    validateAndSetFile(file)
  }

  const handlePreviewSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      validateAndSetPreviewImages(files)
    }
  }

  const removePreviewImage = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index))
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
      // Create FormData for file upload
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

      // Add tags as array
      if (data.tags) {
        const tagsArray = data.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        formData.append('tagsArray', JSON.stringify(tagsArray))
      }

      // Submit form
      const response = await fetch('/api/skin-submissions', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Server error:', errorData)
        throw new Error(errorData.error || errorData.message || `Server error: ${response.status}`)
      }

      const result = await response.json()
      
      toast.success('Your skin has been submitted for review. You will be notified once it\'s approved.')

      // Redirect to custom skins page
      router.push('/custom-skins')
      
    } catch (error) {
      console.error('Submission error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit skin')
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  // Check authentication
  if (!session?.user) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-muted-foreground mb-4">
              You need to be signed in to submit custom skins.
            </p>
            <Button onClick={() => router.push('/auth/signin')}>
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading form data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Your Custom Skin</CardTitle>
        <CardDescription>
          Fill out the form below to submit your custom skin for review. 
          All submissions will be reviewed by our team before being published.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skin Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter skin name..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your skin, features, installation notes..."
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a detailed description of your skin including features and installation instructions.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="championId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Champion *</FormLabel>
                      <div className="relative champion-selector">
                        <FormControl>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              placeholder="Search and select champion..."
                              value={field.value ? getSelectedChampionName(field.value) : (championSearchQuery || '')}
                              onChange={(e) => {
                                const value = e.target.value || ''
                                setChampionSearchQuery(value)
                                if (field.value) {
                                  field.onChange('')
                                }
                                setShowChampionDropdown(true)
                              }}
                              onFocus={() => setShowChampionDropdown(true)}
                              className="pl-10 pr-10 cursor-pointer"
                            />
                            <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-transform ${showChampionDropdown ? 'rotate-180' : ''}`} />
                          </div>
                        </FormControl>
                        {showChampionDropdown && (
                          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredChampions.length > 0 ? (
                              filteredChampions.map((champion) => (
                                <div
                                  key={champion?.id || Math.random()}
                                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex flex-col border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                  onClick={() => {
                                    field.onChange(champion?.id?.toString() || '') // Convert number to string
                                    setChampionSearchQuery('')
                                    setShowChampionDropdown(false)
                                  }}
                                >
                                  <span className="font-medium text-gray-900 dark:text-gray-100">{champion?.name || 'Unknown'}</span>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">{champion?.alias || 'No alias'}</span>
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-center">
                                {championSearchQuery ? 'No champions found matching your search' : 'No champions available'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
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
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="epic, rework, legendary" {...field} />
                      </FormControl>
                      <FormDescription>
                        Separate tags with commas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">File Upload</h3>
              
              {/* Main Skin File */}
              <div className="space-y-2">
                <Label>Skin File * (.zip, .rar, .fantome)</Label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
                    isDragOver 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                      : 'border-muted-foreground/25 hover:border-muted-foreground/40'
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip,.rar,.fantome"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {selectedFile ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Check className="h-5 w-5 text-green-500" />
                        <span className="text-sm font-medium">{selectedFile.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className={`mx-auto h-12 w-12 transition-colors ${
                        isDragOver ? 'text-blue-500' : 'text-muted-foreground'
                      }`} />
                      <div className="mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="mb-2"
                        >
                          Select Skin File
                        </Button>
                        {isDragOver && (
                          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                            Drop your file here!
                          </p>
                        )}
                        {!isDragOver && (
                          <p className="text-sm text-muted-foreground">
                            or drag and drop your file here
                          </p>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Max file size: 100MB. Supported formats: ZIP, RAR, FANTOME
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Images */}
              <div className="space-y-2">
                <Label>Preview Images * (up to 5 images)</Label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
                    isPreviewDragOver 
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                      : 'border-muted-foreground/25 hover:border-muted-foreground/40'
                  }`}
                  onDragEnter={handlePreviewDragEnter}
                  onDragLeave={handlePreviewDragLeave}
                  onDragOver={handlePreviewDragOver}
                  onDrop={handlePreviewDrop}
                >
                  <input
                    ref={previewInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePreviewSelect}
                    className="hidden"
                  />
                  
                  {previewImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      {previewImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                            onClick={() => removePreviewImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => previewInputRef.current?.click()}
                      disabled={previewImages.length >= 5}
                      className="mb-2"
                    >
                      Add Preview Images
                    </Button>
                    {isPreviewDragOver && (
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        Drop your images here!
                      </p>
                    )}
                    {!isPreviewDragOver && (
                      <p className="text-sm text-muted-foreground">
                        or drag and drop images here
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Upload images showing your skin in-game. Max 5MB per image.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Optional Links</h3>
              
              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website/Portfolio URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://your-website.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="youtubeUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube Preview URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://youtube.com/watch?v=..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Guidelines Alert */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Submission Guidelines:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Ensure your skin works with the latest game version</li>
                  <li>• Include clear installation instructions in the description</li>
                  <li>• Upload high-quality preview images showing the skin clearly</li>
                  <li>• Only submit original work or properly credited modifications</li>
                  <li>• All submissions are reviewed before publication</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !selectedFile || previewImages.length === 0}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit for Review
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
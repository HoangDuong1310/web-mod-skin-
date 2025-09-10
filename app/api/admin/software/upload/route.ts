import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { canManageSoftware } from '@/lib/auth-utils'

// Extend timeout for large file uploads
export const maxDuration = 300; // 5 minutes for Pro/Enterprise Vercel plans

const uploadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  version: z.string().min(1, 'Version is required').max(20, 'Version too long'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().max(1000, 'Description too long').optional(),
  content: z.string().max(5000, 'Content too long').optional(),
  status: z.enum(['PUBLISHED', 'DRAFT']).default('DRAFT')
})

// Helper function to generate safe filename
function generateSafeFilename(originalName: string, productId: string): string {
  const extension = originalName.split('.').pop()
  const timestamp = Date.now()
  return `product_${productId}_${timestamp}.${extension}`
}

// Helper function to get file size in MB
function getFileSizeInMB(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(2)
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    
    if (!session || !canManageSoftware(session.user.role)) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { message: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate file size (300MB max)
    const maxSize = 300 * 1024 * 1024 // 300MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: 'File size exceeds 300MB limit' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedExtensions = ['.exe', '.msi', '.zip', '.rar', '.7z']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { message: 'Invalid file type. Only EXE, MSI, ZIP, RAR, 7Z files are allowed' },
        { status: 400 }
      )
    }

    // Validate form data
    const formFields = {
      name: formData.get('name') as string,
      version: formData.get('version') as string,
      category: formData.get('category') as string,
      description: formData.get('description') as string || '',
      content: formData.get('content') as string || '',
      status: formData.get('status') as string || 'DRAFT'
    }

    const validatedData = uploadSchema.parse(formFields)

    // Check if product with same name already exists
    const existingProduct = await prisma.product.findFirst({
      where: {
        title: validatedData.name
      }
    })

    if (existingProduct) {
      return NextResponse.json(
        { message: 'Software with this name already exists' },
        { status: 400 }
      )
    }

    // Find or create category
    let category = await prisma.category.findFirst({
      where: {
        name: validatedData.category
      }
    })

    if (!category) {
      // Create new category if it doesn't exist
      category = await prisma.category.create({
        data: {
          name: validatedData.category,
          slug: validatedData.category.toLowerCase().replace(/\s+/g, '-'),
          description: `${validatedData.category} software category`
        }
      })
    }

    // Generate base slug from product name
    const baseSlug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace any non-alphanumeric characters with dashes
      .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
      .replace(/-+/g, '-') // Replace multiple dashes with single dash

    // Check if slug already exists and make it unique if needed
    let uniqueSlug = baseSlug
    let counter = 1
    
    while (true) {
      const existingProduct = await prisma.product.findUnique({
        where: { slug: uniqueSlug }
      })
      
      if (!existingProduct) {
        break // Slug is unique
      }
      
      uniqueSlug = `${baseSlug}-${counter}`
      counter++
    }

    // Create product record in database first
    const product = await prisma.product.create({
      data: {
        title: validatedData.name,
        slug: uniqueSlug,
        description: validatedData.description,
        content: validatedData.content,
        version: validatedData.version,
        status: validatedData.status as 'PUBLISHED' | 'DRAFT',
        price: 0, // Free software
        stock: 999, // Unlimited downloads
        categoryId: category.id,
        images: JSON.stringify([]), // No images for now
      }
    })

    try {
      // Create uploads directory if it doesn't exist
      const base = process.env.UPLOADS_BASE_PATH || join(process.cwd(), 'uploads')
      const uploadsDir = join(base, 'software')
      await mkdir(uploadsDir, { recursive: true })

      // Generate safe filename and save file
      const safeFilename = generateSafeFilename(file.name, product.id)
      const filePath = join(uploadsDir, safeFilename)
      
      // Convert file to buffer and save
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)

      // Generate download URL
      const downloadUrl = `/api/download/software/${safeFilename}`

      // Update product with download information
      const updatedProduct = await prisma.product.update({
        where: { id: product.id },
        data: {
          downloadUrl: downloadUrl,
          filename: safeFilename,
          fileSize: getFileSizeInMB(file.size) + ' MB'
        }
      })

      // On-demand revalidation for user-facing pages
      try {
        const baseUrl = new URL(request.url)
        const secret = process.env.REVALIDATE_SECRET
        if (secret) {
          const revalidateListUrl = new URL('/api/revalidate', `${baseUrl.protocol}//${baseUrl.host}`)
          revalidateListUrl.searchParams.set('secret', secret)
          revalidateListUrl.searchParams.set('path', '/products')
          await fetch(revalidateListUrl.toString(), { method: 'POST' })

          const revalidateDetailUrl = new URL('/api/revalidate', `${baseUrl.protocol}//${baseUrl.host}`)
          revalidateDetailUrl.searchParams.set('secret', secret)
          revalidateDetailUrl.searchParams.set('path', `/products/${updatedProduct.slug}`)
          await fetch(revalidateDetailUrl.toString(), { method: 'POST' })
        }
      } catch (e) {
        console.warn('Revalidate after upload failed:', e)
      }

      // Return success response
      return NextResponse.json({
        message: 'Software uploaded successfully',
        software: {
          id: updatedProduct.id,
          name: updatedProduct.title,
          version: validatedData.version,
          category: category.name,
          description: updatedProduct.description,
          size: getFileSizeInMB(file.size) + ' MB',
          status: updatedProduct.status,
          downloadUrl: downloadUrl,
          createdAt: updatedProduct.createdAt
        }
      }, { status: 201 })

    } catch (fileError) {
      // If file save failed, delete the database record
      await prisma.product.delete({ where: { id: product.id } })
      
      console.error('File save error:', fileError)
      return NextResponse.json(
        { message: 'Failed to save file' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Upload error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid form data', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

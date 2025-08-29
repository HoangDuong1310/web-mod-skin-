import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper function to generate safe image filename
function generateSafeImageFilename(originalName: string, productId: string): string {
  const extension = originalName.split('.').pop()?.toLowerCase()
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `product_${productId}_${timestamp}_${random}.${extension}`
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const productId = params.id

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const files = formData.getAll('images') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { message: 'No images uploaded' },
        { status: 400 }
      )
    }

    // Validate file types and sizes
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const maxSize = 5 * 1024 * 1024 // 5MB per image
    const maxFiles = 10 // Maximum 10 images per product

    if (files.length > maxFiles) {
      return NextResponse.json(
        { message: `Maximum ${maxFiles} images allowed` },
        { status: 400 }
      )
    }

    const uploadedImages: string[] = []

    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), 'uploads', 'images', 'products')
      await mkdir(uploadsDir, { recursive: true })

      // Process each image
      for (const file of files) {
        if (file.size === 0) continue // Skip empty files

        // Validate file type
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`Invalid file type: ${file.type}. Only JPEG, PNG, WebP, and GIF are allowed.`)
        }

        // Validate file size
        if (file.size > maxSize) {
          throw new Error(`File ${file.name} exceeds 5MB limit`)
        }

        // Generate safe filename and save
        const safeFilename = generateSafeImageFilename(file.name, productId)
        const filePath = join(uploadsDir, safeFilename)
        
        // Convert file to buffer and save
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filePath, buffer)

        // Store API path for database (so images can be served correctly)
        const imageUrl = `/api/uploads/images/products/${safeFilename}`
        uploadedImages.push(imageUrl)
      }

      // Get current images and append new ones
      const currentImages = product.images ? JSON.parse(product.images as string) : []
      const allImages = [...currentImages, ...uploadedImages]

      // Update product with new images
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: {
          images: JSON.stringify(allImages)
        }
      })

      return NextResponse.json({
        message: 'Images uploaded successfully',
        images: uploadedImages,
        totalImages: allImages.length
      }, { status: 200 })

    } catch (fileError) {
      console.error('File save error:', fileError)
      return NextResponse.json(
        { message: fileError instanceof Error ? fileError.message : 'Failed to save images' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const productId = params.id
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json(
        { message: 'Image URL is required' },
        { status: 400 }
      )
    }

    // Get product
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      )
    }

    // Remove image from product
    const currentImages = product.images ? JSON.parse(product.images as string) : []
    const updatedImages = currentImages.filter((img: string) => img !== imageUrl)

    await prisma.product.update({
      where: { id: productId },
      data: {
        images: JSON.stringify(updatedImages)
      }
    })

    return NextResponse.json({
      message: 'Image removed successfully',
      remainingImages: updatedImages.length
    }, { status: 200 })

  } catch (error) {
    console.error('Image delete error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

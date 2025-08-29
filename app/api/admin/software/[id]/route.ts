import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateProductSchema = z.object({
  title: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().optional(),
  content: z.string().optional(),
  version: z.string().optional(),
  price: z.number().min(0),
  stock: z.number().min(0),
  status: z.enum(['PUBLISHED', 'DRAFT']),
  categoryId: z.string(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  downloadUrl: z.string().url().optional().or(z.literal('')),
  externalUrl: z.string().url().optional().or(z.literal('')),
  images: z.string().optional() // Add images field for JSON string
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        _count: {
          select: {
            downloads: true,
            reviews: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('PUT request body:', JSON.stringify(body, null, 2)) // Debug log
    
    const validatedData = updateProductSchema.parse(body)
    console.log('Validated data:', JSON.stringify(validatedData, null, 2)) // Debug log

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id }
    })

    if (!existingProduct) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 })
    }

    // Check if slug is unique (excluding current product)
    if (validatedData.slug !== existingProduct.slug) {
      const slugExists = await prisma.product.findFirst({
        where: {
          slug: validatedData.slug,
          id: { not: params.id }
        }
      })

      if (slugExists) {
        return NextResponse.json({ message: 'Slug already exists' }, { status: 400 })
      }
    }

    // Validate categoryId exists
    if (validatedData.categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: validatedData.categoryId }
      })
      
      if (!categoryExists) {
        return NextResponse.json({ message: 'Category not found' }, { status: 400 })
      }
    }

    // Clean up empty strings to null for optional URL fields
    const updateData: any = {
      title: validatedData.title,
      slug: validatedData.slug,
      description: validatedData.description || null,
      content: validatedData.content || null,
      price: validatedData.price,
      stock: validatedData.stock,
      status: validatedData.status,
      categoryId: validatedData.categoryId,
      metaTitle: validatedData.metaTitle || null,
      metaDescription: validatedData.metaDescription || null,
    }

    // Only update URL fields if they were provided in the payload
    if ('downloadUrl' in validatedData) {
      updateData.downloadUrl = validatedData.downloadUrl || null
    }
    if ('externalUrl' in validatedData) {
      updateData.externalUrl = validatedData.externalUrl || null
    }
    // Only update version if it was provided
    if ('version' in validatedData) {
      updateData.version = validatedData.version || null
    }

    // Handle images JSON field properly
    if ('images' in validatedData && validatedData.images) {
      try {
        // If it's already a string, use as is. If it's parsed JSON, stringify it
        updateData.images = typeof validatedData.images === 'string' 
          ? validatedData.images 
          : JSON.stringify(validatedData.images)
      } catch (error) {
        console.error('Error handling images:', error)
        updateData.images = null
      }
    }

    console.log('Final update data:', JSON.stringify(updateData, null, 2)) // Debug log

    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: true,
        _count: {
          select: {
            downloads: true,
            reviews: true
          }
        }
      }
    })

    return NextResponse.json({ 
      message: 'Product updated successfully',
      product: updatedProduct 
    })

  } catch (error) {
    console.error('Update product error:', error)
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        message: 'Validation error',
        details: error.issues
      }, { status: 400 })
    }
    
    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Prisma error code:', error.code)
      return NextResponse.json({ 
        message: 'Database error',
        code: error.code
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Soft delete by setting deletedAt
    const deletedProduct = await prisma.product.update({
      where: { id: params.id },
      data: { deletedAt: new Date() }
    })

    return NextResponse.json({ 
      message: 'Product deleted successfully',
      product: deletedProduct 
    })

  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

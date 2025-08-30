import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageSoftware } from '@/lib/auth-utils'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !canManageSoftware(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categories = await prisma.category.findMany({
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: [
        { parentId: 'asc' },
        { name: 'asc' }
      ]
    })

    const stats = {
      total: categories.length,
      published: categories.filter(c => c.status === 'PUBLISHED').length,
      draft: categories.filter(c => c.status === 'DRAFT').length,
      totalProducts: categories.reduce((sum, c) => sum + c._count.products, 0)
    }

    return NextResponse.json({ categories, stats })
  } catch (error) {
    console.error('Categories fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !canManageSoftware(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { name, description, parentId, status, metaTitle, metaDescription } = data

    // Generate slug from name
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Check if slug already exists
    const existingCategory = await prisma.category.findUnique({
      where: { slug }
    })

    if (existingCategory) {
      return NextResponse.json({ error: 'Category with this name already exists' }, { status: 400 })
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        parentId: parentId || null,
        status: status || 'DRAFT',
        metaTitle,
        metaDescription
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    return NextResponse.json({ category: newCategory }, { status: 201 })
  } catch (error) {
    console.error('Category creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !canManageSoftware(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { id, name, description, parentId, status, metaTitle, metaDescription } = data

    const updateData: any = {}

    if (name) {
      const slug = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      
      updateData.name = name
      updateData.slug = slug
    }

    if (description !== undefined) updateData.description = description
    if (parentId !== undefined) updateData.parentId = parentId || null
    if (status) updateData.status = status
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    return NextResponse.json({ category: updatedCategory })
  } catch (error) {
    console.error('Category update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !canManageSoftware(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    // Check if category has products
    const categoryWithProducts = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    })

    if (!categoryWithProducts) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    if (categoryWithProducts._count.products > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete category with associated products' 
      }, { status: 400 })
    }

    if (categoryWithProducts._count.children > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete category with subcategories' 
      }, { status: 400 })
    }

    await prisma.category.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Category deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

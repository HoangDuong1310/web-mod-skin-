import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageSoftware } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !canManageSoftware(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const category = searchParams.get('category')

    const skip = (page - 1) * limit

    // Build where clause (exclude soft-deleted by default)
    const where: any = { deletedAt: null }

    if (status && status !== 'all') {
      where.status = status
    }
    if (category && category !== 'all') {
      where.category = {
        slug: category
      }
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          _count: {
            select: {
              downloads: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ])

    // Get stats (exclude soft-deleted)
    const [publishedCount, draftCount, totalDownloads] = await Promise.all([
      prisma.product.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
      prisma.product.count({ where: { status: 'DRAFT', deletedAt: null } }),
      prisma.download.count()
    ])

    const stats = {
      total: total,
      published: publishedCount,
      draft: draftCount,
      totalDownloads: totalDownloads || 0
    }

    // Transform products to match expected format
    const software = products.map(product => ({
      id: product.id,
      name: product.title,
      slug: product.slug,
      category: product.category?.name || 'Uncategorized',
      categorySlug: product.category?.slug || '',
      description: product.description,
      version: product.version,
      price: Number(product.price),
      stock: product.stock,
      downloads: product._count.downloads,
      averageRating: Number(product.averageRating),
      totalReviews: product.totalReviews,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      status: product.status,
      images: product.images || [],
      // Key settings
      requiresKey: product.requiresKey || false,
      adBypassEnabled: product.adBypassEnabled || false,
      freeKeyPlanId: product.freeKeyPlanId || null
    }))

    return NextResponse.json({
      software,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Software fetch error:', error)
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
    const {
      title,
      slug,
      description,
      content,
      price,
      categoryId,
      stock,
      status,
      images,
      metaTitle,
      metaDescription
    } = data

    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug }
    })

    if (existingProduct) {
      return NextResponse.json({ error: 'Product slug already exists' }, { status: 400 })
    }

    const newProduct = await prisma.product.create({
      data: {
        title,
        slug,
        description,
        content: content || '',
        price: parseFloat(price) || 0,
        stock: parseInt(stock) || 0,
        categoryId,
        status: status || 'DRAFT',
        images: images && images.length > 0 ? JSON.stringify(images) : null,
        metaTitle,
        metaDescription,
        averageRating: 0,
        totalReviews: 0
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    return NextResponse.json({ product: newProduct }, { status: 201 })
  } catch (error) {
    console.error('Software creation error:', error)
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
    const {
      id,
      title,
      slug,
      description,
      content,
      version,
      price,
      categoryId,
      stock,
      status,
      images,
      metaTitle,
      metaDescription
    } = data

    // Check if slug already exists (excluding current product)
    if (slug) {
      const existingProduct = await prisma.product.findUnique({
        where: { slug }
      })

      if (existingProduct && existingProduct.id !== id) {
        return NextResponse.json({ error: 'Product slug already exists' }, { status: 400 })
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(slug && { slug }),
        ...(description && { description }),
        ...(content && { content }),
        ...(version !== undefined && { version }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(categoryId && { categoryId }),
        ...(status && { status }),
        ...(images && { images }),
        ...(metaTitle && { metaTitle }),
        ...(metaDescription && { metaDescription }),
        updatedAt: new Date()
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    return NextResponse.json({ product: updatedProduct })
  } catch (error) {
    console.error('Software update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only ADMIN can delete software
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Check if product has downloads
    const downloads = await prisma.download.findFirst({
      where: { productId: id }
    })

    if (downloads) {
      return NextResponse.json({
        error: 'Cannot delete product that has been downloaded. Archive it instead.'
      }, { status: 400 })
    }

    await prisma.product.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Software delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { z } from 'zod'

const submitSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  championId: z.string().min(1),
  categoryId: z.string().min(1),
  version: z.string().min(1).max(20),
  tags: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  youtubeUrl: z.string().url().optional().or(z.literal(''))
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const formData = await request.formData()
    
    // Extract text fields
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      championId: formData.get('championId') as string,
      categoryId: formData.get('categoryId') as string,
      version: formData.get('version') as string,
      tags: formData.get('tags') as string || '',
      websiteUrl: formData.get('websiteUrl') as string || '',
      youtubeUrl: formData.get('youtubeUrl') as string || ''
    }

    // Validate data
    const validatedData = submitSchema.parse(data)

    // Get files
    const skinFile = formData.get('skinFile') as File
    if (!skinFile) {
      return NextResponse.json({ error: 'Skin file is required' }, { status: 400 })
    }

    // Validate file type and size
    const allowedTypes = ['.zip', '.rar', '.fantome']
    const fileExtension = '.' + skinFile.name.split('.').pop()?.toLowerCase()
    
    if (!allowedTypes.includes(fileExtension)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only .zip, .rar, and .fantome files are allowed' 
      }, { status: 400 })
    }

    const maxSize = 50 * 1024 * 1024 // 50MB
    if (skinFile.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size too large. Maximum size is 50MB' 
      }, { status: 400 })
    }

    // Get preview images
    const previewImages: File[] = []
    let imageIndex = 0
    while (formData.get(`previewImage_${imageIndex}`)) {
      const image = formData.get(`previewImage_${imageIndex}`) as File
      if (image && image.size > 0) {
        previewImages.push(image)
      }
      imageIndex++
    }

    if (previewImages.length === 0) {
      return NextResponse.json({ 
        error: 'At least one preview image is required' 
      }, { status: 400 })
    }

    // Validate champion and category exist
    const [champion, category] = await Promise.all([
      prisma.champion.findUnique({ where: { id: parseInt(validatedData.championId) } }),
      prisma.skinCategory.findUnique({ where: { id: validatedData.categoryId } })
    ])

    if (!champion) {
      return NextResponse.json({ error: 'Invalid champion selected' }, { status: 400 })
    }

    if (!category) {
      return NextResponse.json({ error: 'Invalid category selected' }, { status: 400 })
    }

    // Create upload directories
    const uploadsDir = path.join(process.cwd(), 'uploads')
    const skinsDir = path.join(uploadsDir, 'skins')
    const previewsDir = path.join(uploadsDir, 'previews')
    
    await mkdir(skinsDir, { recursive: true })
    await mkdir(previewsDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedName = validatedData.name.replace(/[^a-zA-Z0-9-_]/g, '_')
    const skinFileName = `${sanitizedName}_${timestamp}${fileExtension}`
    const skinFilePath = path.join(skinsDir, skinFileName)

    // Save skin file
    const skinBuffer = Buffer.from(await skinFile.arrayBuffer())
    await writeFile(skinFilePath, skinBuffer)

    // Save preview images
    const previewPaths: string[] = []
    for (let i = 0; i < previewImages.length; i++) {
      const image = previewImages[i]
      const imageExtension = '.' + image.name.split('.').pop()?.toLowerCase()
      const previewFileName = `${sanitizedName}_${timestamp}_preview_${i}${imageExtension}`
      const previewFilePath = path.join(previewsDir, previewFileName)
      
      const imageBuffer = Buffer.from(await image.arrayBuffer())
      await writeFile(previewFilePath, imageBuffer)
      
      previewPaths.push(`/uploads/previews/${previewFileName}`)
    }

    // Parse tags
    const tagsArray = validatedData.tags 
      ? validatedData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      : []

    // Create submission record
    const submission = await prisma.skinSubmission.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        version: validatedData.version,
        fileName: skinFileName,
        filePath: `/uploads/skins/${skinFileName}`,
        fileSize: skinFile.size.toString(),
        fileType: fileExtension.slice(1).toUpperCase() as any,
        previewImages: JSON.stringify(previewPaths.filter(path => path && typeof path === 'string')),
        
        
        status: 'PENDING',
        submitterId: session.user.id,
        championId: parseInt(validatedData.championId),
        categoryId: validatedData.categoryId
      },
      include: {
        champion: true,
        category: true,
        submitter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Skin submitted successfully',
      submission: {
        id: submission.id,
        name: submission.name,
        status: submission.status,
        championId: submission.championId,
        categoryId: submission.categoryId
      }
    })

  } catch (error) {
    console.error('Submission error:', error)
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors)
      return NextResponse.json({
        error: 'Invalid form data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Failed to submit skin',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Get user's submissions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || 'all'

    const where: any = {
      submitterId: session.user.id
    }

    if (status !== 'all') {
      where.status = status.toUpperCase()
    }

    const [submissions, total] = await Promise.all([
      prisma.skinSubmission.findMany({
        where,
        include: {
          champion: true,
          category: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.skinSubmission.count({ where })
    ])

    return NextResponse.json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get submissions error:', error)
    return NextResponse.json({
      error: 'Failed to get submissions'
    }, { status: 500 })
  }
}
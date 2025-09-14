import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const championId = searchParams.get('championId')
    const categoryId = searchParams.get('categoryId') 
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const offset = (page - 1) * limit

    const where: any = {
      status: 'APPROVED',
      deletedAt: null
    }

    if (championId) {
      where.championId = parseInt(championId)
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [submissions, total] = await Promise.all([
      (prisma as any).skinSubmission.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          champion: {
            select: {
              name: true,
              alias: true,
              squarePortraitPath: true
            }
          },
          category: {
            select: {
              name: true,
              slug: true
            }
          },
          submitter: {
            select: {
              name: true,
              image: true
            }
          }
        }
      }),
      (prisma as any).skinSubmission.count({ where })
    ])

    // Transform to match CustomSkin interface
    const transformedSubmissions = submissions.map((submission: any) => ({
      id: submission.id,
      name: submission.name,
      description: submission.description,
      version: submission.version,
      championId: submission.championId,
      categoryId: submission.categoryId,
      authorId: submission.submitterId,
      fileName: submission.fileName,
      filePath: submission.filePath,
      fileSize: submission.fileSize,
      fileType: submission.fileType,
      previewImages: submission.previewImages ? JSON.parse(submission.previewImages) : [],
      thumbnailImage: submission.thumbnailImage,
      status: submission.status,
      downloadCount: 0, // SkinSubmission doesn't have downloadCount
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      deletedAt: submission.deletedAt,
      champion: submission.champion,
      category: submission.category,
      author: submission.submitter
    }))

    return NextResponse.json({
      submissions: transformedSubmissions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })

  } catch (error) {
    console.error('Error fetching skin submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch skin submissions' },
      { status: 500 }
    )
  }
}

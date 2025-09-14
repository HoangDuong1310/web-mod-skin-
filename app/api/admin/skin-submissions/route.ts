import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const reviewSchema = z.object({
  submissionId: z.string(),
  action: z.enum(['approve', 'reject', 'needs_revision']),
  feedbackMessage: z.string().optional(),
  adminNotes: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const where: any = {
      deletedAt: null
    }

    if (status) {
      where.status = status
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
              name: true
            }
          },
          submitter: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          reviewer: {
            select: {
              name: true
            }
          }
        }
      }),
      (prisma as any).skinSubmission.count({ where })
    ])

    // Parse preview images
    const parsedSubmissions = submissions.map((submission: any) => ({
      ...submission,
      previewImages: submission.previewImages ? JSON.parse(submission.previewImages) : []
    }))

    return NextResponse.json({
      submissions: parsedSubmissions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })

  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { submissionId, action, feedbackMessage, adminNotes } = reviewSchema.parse(body)

    // Get submission
    const submission = await (prisma as any).skinSubmission.findUnique({
      where: { id: submissionId }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    if (action === 'approve') {
      // Create approved skin
      await (prisma as any).customSkin.create({
        data: {
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
          previewImages: submission.previewImages,
          thumbnailImage: submission.thumbnailImage,
          status: 'APPROVED'
        }
      })

      // Update submission status
      await (prisma as any).skinSubmission.update({
        where: { id: submissionId },
        data: {
          status: 'APPROVED',
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          adminNotes,
          feedbackMessage: feedbackMessage || 'Your skin has been approved and is now live!'
        }
      })

      return NextResponse.json({
        message: 'Skin approved successfully',
        action: 'approved'
      })

    } else if (action === 'reject') {
      await (prisma as any).skinSubmission.update({
        where: { id: submissionId },
        data: {
          status: 'REJECTED',
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          adminNotes,
          feedbackMessage: feedbackMessage || 'Your skin submission has been rejected.'
        }
      })

      return NextResponse.json({
        message: 'Skin rejected',
        action: 'rejected'
      })

    } else if (action === 'needs_revision') {
      await (prisma as any).skinSubmission.update({
        where: { id: submissionId },
        data: {
          status: 'NEEDS_REVISION',
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          adminNotes,
          feedbackMessage: feedbackMessage || 'Your skin needs some revisions. Please check the feedback and resubmit.'
        }
      })

      return NextResponse.json({
        message: 'Skin marked for revision',
        action: 'needs_revision'
      })
    }

  } catch (error) {
    console.error('Error reviewing submission:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to review submission' },
      { status: 500 }
    )
  }
}
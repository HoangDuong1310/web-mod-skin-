import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Find the submission
    const submission = await (prisma as any).skinSubmission.findUnique({
      where: {
        id: params.id,
        submitterId: session.user.id, // Only allow users to delete their own submissions
        deletedAt: null
      }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found or not authorized' },
        { status: 404 }
      )
    }

    // Soft delete
    await (prisma as any).skinSubmission.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date()
      }
    })

    return NextResponse.json({ message: 'Submission deleted successfully' })
  } catch (error) {
    console.error('Error deleting submission:', error)
    return NextResponse.json(
      { error: 'Failed to delete submission' },
      { status: 500 }
    )
  }
}

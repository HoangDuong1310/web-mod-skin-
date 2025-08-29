import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { z } from 'zod'

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(['USER', 'STAFF', 'ADMIN']).optional(),
  image: z.string().url().optional().or(z.literal('')),
  emailVerified: z.boolean().optional(),
})

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can view user details' },
        { status: 403 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id, deletedAt: null },
      include: {
        _count: {
          select: {
            downloads: true,
            reviews: true,
            posts: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Remove sensitive data
    const { password, ...safeUser } = user

    return NextResponse.json({ user: safeUser })

  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can edit users' },
        { status: 403 }
      )
    }

    // Cannot edit yourself through this endpoint (safety)
    if (session.user.id === params.id) {
      return NextResponse.json(
        { error: 'Cannot edit your own account through this endpoint' },
        { status: 400 }
      )
    }

    const body = await request.json()
    console.log('🔵 Updating user:', params.id, body)

    // Validate the request data
    const validation = updateUserSchema.safeParse(body)
    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.issues)
      return NextResponse.json(
        { 
          error: 'Invalid user data',
          details: validation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      )
    }

    const updateData = validation.data

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id, deletedAt: null }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // If email is being changed, check it's not already taken
    if (updateData.email && updateData.email.toLowerCase() !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: updateData.email.toLowerCase() }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already in use by another user' },
          { status: 400 }
        )
      }
    }

    // Update the user
    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...updateData,
        email: updateData.email?.toLowerCase(),
        image: updateData.image || null,
        emailVerified: updateData.emailVerified !== undefined 
          ? (updateData.emailVerified ? new Date() : null) 
          : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    console.log('✅ User updated successfully:', { id: user.id, email: user.email })

    return NextResponse.json({
      user,
      message: 'User updated successfully',
    })

  } catch (error) {
    console.error('❌ Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can delete users' },
        { status: 403 }
      )
    }

    // Cannot delete yourself
    if (session.user.id === params.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id, deletedAt: null }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Soft delete the user
    await prisma.user.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
      },
    })

    console.log('✅ User deleted successfully:', params.id)

    return NextResponse.json({
      message: 'User deleted successfully',
    })

  } catch (error) {
    console.error('❌ Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}

// Password reset endpoint
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can reset passwords' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate password
    const validation = resetPasswordSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid password data',
          details: validation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      )
    }

    const { newPassword } = validation.data

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id, deletedAt: null }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 12)

    // Update user password
    await prisma.user.update({
      where: { id: params.id },
      data: {
        password: hashedPassword,
      },
    })

    console.log('✅ Password reset successfully for user:', params.id)

    // TODO: Send password reset email notification

    return NextResponse.json({
      message: 'Password reset successfully',
    })

  } catch (error) {
    console.error('❌ Error resetting password:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}

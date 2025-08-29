import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { roleUtils } from '@/lib/roles'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if current user is admin
    if (!roleUtils.isAdmin(session?.user?.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Promote user to admin
    const success = await roleUtils.promoteToAdmin(email)

    if (success) {
      return NextResponse.json(
        { message: `User ${email} promoted to admin successfully` },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { error: 'Failed to promote user' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Promote admin error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

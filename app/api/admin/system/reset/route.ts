import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { systemOperations } from '@/lib/system-operations'

export async function POST(request: NextRequest) {
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
        { error: 'Only admins can reset system' },
        { status: 403 }
      )
    }

    const result = await systemOperations.resetSystem()

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Failed to reset system',
          details: result.error 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'System reset completed (simulation only)',
      timestamp: new Date().toISOString(),
      warning: 'This was a simulation - no actual data was destroyed'
    })

  } catch (error) {
    console.error('❌ Error resetting system:', error)
    return NextResponse.json(
      { error: 'Failed to reset system' },
      { status: 500 }
    )
  }
}
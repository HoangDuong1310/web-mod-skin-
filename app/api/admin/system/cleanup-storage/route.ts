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
        { error: 'Only admins can cleanup storage' },
        { status: 403 }
      )
    }

    const result = await systemOperations.cleanupStorage()

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Failed to cleanup storage',
          details: result.errors 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Storage cleanup completed successfully',
      cleaned: result.cleaned,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('❌ Error cleaning up storage:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup storage' },
      { status: 500 }
    )
  }
}
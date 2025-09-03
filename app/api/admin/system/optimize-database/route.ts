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
        { error: 'Only admins can optimize database' },
        { status: 403 }
      )
    }

    const success = await systemOperations.optimizeDatabase()

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to optimize database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Database optimization completed successfully',
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('❌ Error optimizing database:', error)
    return NextResponse.json(
      { error: 'Failed to optimize database' },
      { status: 500 }
    )
  }
}
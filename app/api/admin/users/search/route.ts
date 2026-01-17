/**
 * API Route: /api/admin/users/search
 * Tìm kiếm users (cho admin gán license)
 * Method: GET
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'STAFF'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')
    
    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }
    
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query } },
          { name: { contains: query } },
        ],
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            licenseKeys: true,
          },
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json({
      success: true,
      data: users.map(u => ({
        ...u,
        licenseCount: u._count.licenseKeys,
        _count: undefined,
      })),
    })
  } catch (error) {
    console.error('Search users error:', error)
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}

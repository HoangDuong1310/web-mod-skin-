import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Bulk operations on custom skins
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, skinIds } = body

    if (!action || !skinIds || !Array.isArray(skinIds) || skinIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    let updateData: any = {}
    let message = ''

    switch (action) {
      case 'delete':
        updateData = { deletedAt: new Date() }
        message = `${skinIds.length} skins deleted successfully`
        break
      
      case 'feature':
        updateData = { status: 'FEATURED', updatedAt: new Date() }
        message = `${skinIds.length} skins marked as featured`
        break
      
      case 'hide':
        updateData = { status: 'HIDDEN', updatedAt: new Date() }
        message = `${skinIds.length} skins hidden`
        break
      
      case 'approve':
        updateData = { status: 'APPROVED', updatedAt: new Date() }
        message = `${skinIds.length} skins approved`
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Verify all skins exist and are not already deleted (except for delete action)
    const existingSkins = await (prisma as any).customSkin.findMany({
      where: {
        id: { in: skinIds },
        ...(action !== 'delete' && { deletedAt: null })
      },
      select: { id: true }
    })

    const existingIds = existingSkins.map((skin: any) => skin.id)
    const notFoundIds = skinIds.filter((id: string) => !existingIds.includes(id))

    if (notFoundIds.length > 0) {
      return NextResponse.json(
        { 
          error: `Some skins not found: ${notFoundIds.join(', ')}`,
          notFound: notFoundIds
        },
        { status: 404 }
      )
    }

    // Perform bulk update
    const result = await (prisma as any).customSkin.updateMany({
      where: {
        id: { in: skinIds }
      },
      data: updateData
    })

    return NextResponse.json({
      message,
      updated: result.count,
      action,
      skinIds
    })
  } catch (error) {
    console.error('Error performing bulk operation:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bulkActionSchema = z.object({
  action: z.enum(['feature', 'unfeature', 'hide', 'unhide', 'delete', 'export']),
  skinIds: z.array(z.string()).min(1, 'At least one skin ID is required')
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate request body
    const validation = bulkActionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { action, skinIds } = validation.data

    // Verify all skins exist and are approved
    const existingSkins = await prisma.customSkin.findMany({
      where: {
        id: { in: skinIds },
        status: 'APPROVED'
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        },
        champion: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (existingSkins.length !== skinIds.length) {
      return NextResponse.json(
        { error: 'Some skins not found or not approved' },
        { status: 404 }
      )
    }

    let result: any = {}

    switch (action) {
      case 'feature': {
        const featuredResult = await prisma.customSkin.updateMany({
          where: {
            id: { in: skinIds },
            status: 'APPROVED'
          },
          data: {
            status: 'FEATURED',
            updatedAt: new Date()
          }
        })

        // Log activity
        await prisma.auditLog.createMany({
          data: skinIds.map(skinId => ({
            userId: session.user.id,
            action: 'FEATURE_SKIN',
            details: `Bulk featured custom skin: ${skinId}`
          }))
        })

        result = {
          message: `Featured ${featuredResult.count} skins successfully`,
          count: featuredResult.count
        }
        break
      }

      case 'unfeature': {
        const unfeaturedResult = await prisma.customSkin.updateMany({
          where: {
            id: { in: skinIds },
            status: 'FEATURED'
          },
          data: {
            status: 'APPROVED',
            updatedAt: new Date()
          }
        })

        // Log activity
        await prisma.auditLog.createMany({
          data: skinIds.map(skinId => ({
            userId: session.user.id,
            action: 'UNFEATURE_SKIN',
            details: `Bulk unfeatured custom skin: ${skinId}`
          }))
        })

        result = {
          message: `Unfeatured ${unfeaturedResult.count} skins successfully`,
          count: unfeaturedResult.count
        }
        break
      }

      case 'hide': {
        const hiddenResult = await prisma.customSkin.updateMany({
          where: {
            id: { in: skinIds },
            status: { not: 'HIDDEN' }
          },
          data: {
            status: 'HIDDEN',
            updatedAt: new Date()
          }
        })

        // Log activity
        await prisma.auditLog.createMany({
          data: skinIds.map(skinId => ({
            userId: session.user.id,
            action: 'HIDE_SKIN',
            details: `Bulk hidden custom skin: ${skinId}`
          }))
        })

        result = {
          message: `Hidden ${hiddenResult.count} skins successfully`,
          count: hiddenResult.count
        }
        break
      }

      case 'unhide': {
        const unhiddenResult = await prisma.customSkin.updateMany({
          where: {
            id: { in: skinIds },
            status: 'HIDDEN'
          },
          data: {
            status: 'APPROVED',
            updatedAt: new Date()
          }
        })

        // Log activity
        await prisma.auditLog.createMany({
          data: skinIds.map(skinId => ({
            userId: session.user.id,
            action: 'UNHIDE_SKIN',
            details: `Bulk unhidden custom skin: ${skinId}`
          }))
        })

        result = {
          message: `Unhidden ${unhiddenResult.count} skins successfully`,
          count: unhiddenResult.count
        }
        break
      }

      case 'delete': {
        // Soft delete - set deletedAt timestamp
        const deletedResult = await prisma.customSkin.updateMany({
          where: {
            id: { in: skinIds },
            deletedAt: null
          },
          data: {
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        })

        // Log activity
        await prisma.auditLog.createMany({
          data: skinIds.map(skinId => ({
            userId: session.user.id,
            action: 'DELETE_SKIN',
            details: `Bulk deleted custom skin: ${skinId} (soft delete)`
          }))
        })

        result = {
          message: `Deleted ${deletedResult.count} skins successfully`,
          count: deletedResult.count
        }
        break
      }

      case 'export': {
        // Export skin data as JSON
        const exportData = existingSkins.map(skin => ({
          id: skin.id,
          name: skin.name,
          description: skin.description,
          author: skin.author,
          category: skin.category,
          champion: skin.champion,
          fileName: skin.fileName,
          filePath: skin.filePath,
          fileSize: skin.fileSize,
          fileType: skin.fileType,
          previewImages: skin.previewImages,
          thumbnailImage: skin.thumbnailImage,
          downloadCount: skin.downloadCount,
          status: skin.status,
          createdAt: skin.createdAt,
          updatedAt: skin.updatedAt
        }))

        // Log activity
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'EXPORT_SKINS',
            details: `Bulk exported ${skinIds.length} custom skins`
          }
        })

        result = {
          message: `Exported ${exportData.length} skins successfully`,
          data: exportData,
          count: exportData.length
        }
        break
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Bulk approved skins operation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
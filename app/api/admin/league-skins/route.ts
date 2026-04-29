import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFromR2 } from '@/lib/r2'
import { generateAndUploadManifest } from '@/lib/league-skins-manifest'

// GET - List champions with skins count, search, pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const search = searchParams.get('search') || ''
    const championId = searchParams.get('championId')
    const view = searchParams.get('view') || 'champions' // 'champions' | 'skins'
    const skip = (page - 1) * limit

    if (view === 'skins') {
      // List individual skins
      const where: any = {}

      if (search) {
        where.OR = [
          { nameEn: { contains: search } },
          { nameVi: { contains: search } },
        ]
      }

      if (championId) {
        where.championId = parseInt(championId)
      }

      const [skins, total] = await Promise.all([
        prisma.leagueSkin.findMany({
          where,
          include: { champion: { select: { nameEn: true, nameVi: true, championId: true } } },
          orderBy: [{ championId: 'asc' }, { skinId: 'asc' }],
          skip,
          take: limit,
        }),
        prisma.leagueSkin.count({ where }),
      ])

      return NextResponse.json({
        skins,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      })
    }

    // Default: list champions with skin counts
    const where: any = {}
    if (search) {
      where.OR = [
        { nameEn: { contains: search } },
        { nameVi: { contains: search } },
      ]
    }

    const [champions, total] = await Promise.all([
      prisma.leagueChampion.findMany({
        where,
        include: {
          _count: { select: { skins: true } },
          skins: {
            select: { skinId: true, nameEn: true, fileUrl: true, isActive: true },
            orderBy: { skinId: 'asc' },
          },
        },
        orderBy: { championId: 'asc' },
        skip,
        take: limit,
      }),
      prisma.leagueChampion.count({ where }),
    ])

    // Stats
    const [totalChampions, totalSkins, totalWithFiles] = await Promise.all([
      prisma.leagueChampion.count(),
      prisma.leagueSkin.count(),
      prisma.leagueSkin.count({ where: { fileUrl: { not: null } } }),
    ])

    return NextResponse.json({
      champions,
      stats: { totalChampions, totalSkins, totalWithFiles },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching league skins:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a skin or champion
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { skinId, championId } = await request.json()

    if (skinId) {
      const skin = await prisma.leagueSkin.findUnique({ where: { skinId: parseInt(skinId) } })
      if (!skin) {
        return NextResponse.json({ error: 'Skin not found' }, { status: 404 })
      }

      // Delete file from R2
      if (skin.fileUrl) {
        try { await deleteFromR2(skin.fileUrl) } catch {}
      }

      await prisma.leagueSkin.delete({ where: { skinId: parseInt(skinId) } })

      // Regenerate manifest after skin deletion (removes skin entry + bumps version)
      try {
        await generateAndUploadManifest()
      } catch (err) {
        console.error('Manifest generation failed after skin deletion:', err)
      }

      return NextResponse.json({ success: true, message: 'Skin deleted' })
    }

    if (championId) {
      // Delete all skins' files from R2
      const skins = await prisma.leagueSkin.findMany({
        where: { championId: parseInt(championId) },
        select: { fileUrl: true },
      })
      
      for (const skin of skins) {
        if (skin.fileUrl) {
          try { await deleteFromR2(skin.fileUrl) } catch {}
        }
      }

      // Delete champion (cascades to skins)
      await prisma.leagueChampion.delete({
        where: { championId: parseInt(championId) },
      })

      // Regenerate manifest after champion deletion (removes all champion skins + bumps version)
      try {
        await generateAndUploadManifest()
      } catch (err) {
        console.error('Manifest generation failed after champion deletion:', err)
      }

      return NextResponse.json({ success: true, message: 'Champion and all skins deleted' })
    }

    return NextResponse.json({ error: 'Provide skinId or championId' }, { status: 400 })
  } catch (error) {
    console.error('Error deleting:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get basic statistics and configuration for apps
    const [
      totalSkins,
      totalCategories,
      totalChampions,
      recentSkins
    ] = await Promise.all([
      prisma.skinSubmission.count({
        where: { status: 'APPROVED', deletedAt: null }
      }),
      prisma.skinCategory.count(),
      prisma.champion.count(),
      prisma.skinSubmission.findMany({
        where: { status: 'APPROVED', deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          createdAt: true
        }
      })
    ])

    return NextResponse.json({
      // App configuration
      config: {
        protocol: 'skinmod://',
        supportedFileTypes: ['FANTOME', 'ZIP'],
        maxFileSize: '100MB',
        rateLimit: {
          downloads: 50, // per hour
          requests: 100  // per minute
        }
      },
      
      // Server statistics
      stats: {
        totalSkins,
        totalCategories,
        totalChampions,
        lastUpdated: new Date().toISOString()
      },
      
      // Recent additions
      recent: recentSkins,
      
      // API endpoints for apps
      endpoints: {
        browse: '/api/custom-skins',
        download: '/api/custom-skins/[id]/download',
        downloadInfo: '/api/custom-skins/[id]/download-info',
        bulkDownloadInfo: '/api/custom-skins/bulk-download-info',
        checkUpdates: '/api/custom-skins/check-updates',
        champions: '/api/champions',
        categories: '/api/custom-skins/categories'
      }
    })
  } catch (error) {
    console.error('App config error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
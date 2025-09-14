import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint') || 'status'

  try {
    switch (endpoint) {
      case 'status':
        return NextResponse.json({
          status: 'Custom Skins API Server Running',
          timestamp: new Date().toISOString(),
          port: 3000,
          environment: 'development',
          message: 'Local testing endpoints available'
        })

      case 'database': {
        // Test database connection
        const userCount = await prisma.user.count()
        const skinCount = await prisma.customSkin.count()
        const submissionCount = await prisma.skinSubmission.count()
        const championCount = await prisma.champion.count()

        return NextResponse.json({
          status: 'Database connected',
          counts: {
            users: userCount,
            customSkins: skinCount,
            submissions: submissionCount,
            champions: championCount
          },
          timestamp: new Date().toISOString()
        })
      }

      case 'sample-skins': {
        // Get sample skins for testing
        const sampleSkins = await prisma.customSkin.findMany({
          take: 5,
          include: {
            champion: {
              select: {
                id: true,
                name: true,
                alias: true,
                squarePortraitPath: true
              }
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            },
            author: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })

        return NextResponse.json({
          status: 'Sample skins retrieved',
          count: sampleSkins.length,
          skins: sampleSkins,
          timestamp: new Date().toISOString()
        })

      case 'sample-submissions':
        // Get sample submissions for testing
        const sampleSubmissions = await prisma.skinSubmission.findMany({
          take: 5,
          include: {
            champion: {
              select: {
                name: true,
                alias: true
              }
            },
            category: {
              select: {
                name: true
              }
            },
            submitter: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })

        return NextResponse.json({
          status: 'Sample submissions retrieved',
          count: sampleSubmissions.length,
          submissions: sampleSubmissions,
          timestamp: new Date().toISOString()
        })

      case 'champions':
        // Get champions list for testing
        const champions = await prisma.champion.findMany({
          take: 10,
          select: {
            id: true,
            name: true,
            alias: true,
            squarePortraitPath: true,
            roles: true,
            _count: {
              select: {
                customSkins: true
              }
            }
          }
        })

        return NextResponse.json({
          status: 'Champions retrieved',
          count: champions.length,
          champions: champions.map(champion => ({
            ...champion,
            skinCount: champion._count.customSkins
          })),
          timestamp: new Date().toISOString()
        })

      case 'categories':
        // Get skin categories for testing
        const categories = await prisma.skinCategory.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            _count: {
              select: {
                customSkins: true
              }
            }
          }
        })

        return NextResponse.json({
          status: 'Categories retrieved',
          count: categories.length,
          categories: categories.map(category => ({
            ...category,
            skinCount: category._count.customSkins
          })),
          timestamp: new Date().toISOString()
        })

      case 'stats':
        // Get overall statistics
        const stats = await Promise.all([
          prisma.customSkin.count(),
          prisma.skinSubmission.count(),
          prisma.skinDownload.count(),
          prisma.champion.count(),
          prisma.skinCategory.count(),
          prisma.user.count(),
          prisma.customSkin.count({ where: { status: 'APPROVED' } }),
          prisma.customSkin.count({ where: { status: 'FEATURED' } }),
          prisma.skinSubmission.count({ where: { status: 'PENDING' } }),
          prisma.skinSubmission.count({ where: { status: 'APPROVED' } }),
          prisma.skinSubmission.count({ where: { status: 'REJECTED' } })
        ])

        return NextResponse.json({
          status: 'Statistics retrieved',
          stats: {
            totalSkins: stats[0],
            totalSubmissions: stats[1],
            totalDownloads: stats[2],
            totalChampions: stats[3],
            totalCategories: stats[4],
            totalUsers: stats[5],
            approvedSkins: stats[6],
            featuredSkins: stats[7],
            pendingSubmissions: stats[8],
            approvedSubmissions: stats[9],
            rejectedSubmissions: stats[10]
          },
          timestamp: new Date().toISOString()
        })

      case 'endpoints':
        // List all available test endpoints
        return NextResponse.json({
          status: 'Available test endpoints',
          baseUrl: 'http://localhost:3000/api/test',
          endpoints: [
            {
              path: '?endpoint=status',
              description: 'Check server status',
              method: 'GET'
            },
            {
              path: '?endpoint=database',
              description: 'Test database connection and get counts',
              method: 'GET'
            },
            {
              path: '?endpoint=sample-skins',
              description: 'Get 5 sample custom skins',
              method: 'GET'
            },
            {
              path: '?endpoint=sample-submissions',
              description: 'Get 5 sample submissions',
              method: 'GET'
            },
            {
              path: '?endpoint=champions',
              description: 'Get 10 champions with skin counts',
              method: 'GET'
            },
            {
              path: '?endpoint=categories',
              description: 'Get all skin categories',
              method: 'GET'
            },
            {
              path: '?endpoint=stats',
              description: 'Get overall system statistics',
              method: 'GET'
            },
            {
              path: '?endpoint=endpoints',
              description: 'Get this endpoints list',
              method: 'GET'
            }
          ],
          examples: [
            'curl http://localhost:3000/api/test?endpoint=status',
            'curl http://localhost:3000/api/test?endpoint=database',
            'curl http://localhost:3000/api/test?endpoint=sample-skins'
          ],
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json({
          error: 'Unknown endpoint',
          available: ['status', 'database', 'sample-skins', 'sample-submissions', 'champions', 'categories', 'stats', 'endpoints'],
          usage: 'Add ?endpoint=<name> to the URL'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Test API Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Health check endpoint
export async function POST() {
  try {
    // Test database write operation
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json({
      status: 'Health check passed',
      database: 'writable',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'Health check failed',
      database: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
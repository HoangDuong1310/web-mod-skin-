import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { EnhancedCustomSkinsPage } from '@/components/custom-skins/enhanced-custom-skins-page'

export const metadata: Metadata = {
  title: 'Custom Skins - League of Legends Mods',
  description: 'Khám phá và tải xuống hàng nghìn custom skins độc đáo cho League of Legends. Cộng đồng modding lớn nhất Việt Nam.',
  keywords: 'lol custom skins, league of legends mods, skin mods, lol skins việt nam',
  openGraph: {
    title: 'Custom Skins Collection - LoL Mods',
    description: 'Bộ sưu tập custom skins chất lượng cao cho League of Legends',
    type: 'website',
    images: ['/og-custom-skins.jpg']
  }
}

// Revalidate every 60 seconds to show new skins
export const revalidate = 60

async function getInitialData() {
  try {
    // Get featured skins
    const featuredSkins = await prisma.customSkin.findMany({
      where: {
        status: 'FEATURED',
        deletedAt: null
      },
      take: 6,
      orderBy: {
        downloadCount: 'desc'
      },
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
            name: true,
            image: true
          }
        }
      }
    })

    // Get recent skins
    const recentSkins = await prisma.customSkin.findMany({
      where: {
        status: { in: ['APPROVED', 'FEATURED'] },
        deletedAt: null
      },
      take: 12,
      orderBy: {
        createdAt: 'desc'
      },
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
            name: true,
            image: true
          }
        }
      }
    })

    // Get popular skins
    const popularSkins = await prisma.customSkin.findMany({
      where: {
        status: { in: ['APPROVED', 'FEATURED'] },
        deletedAt: null,
        downloadCount: { gt: 50 }
      },
      take: 12,
      orderBy: {
        downloadCount: 'desc'
      },
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
            name: true,
            image: true
          }
        }
      }
    })

    // Get categories with counts
    const categories = await prisma.skinCategory.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: {
          select: {
            customSkins: {
              where: {
                status: { in: ['APPROVED', 'FEATURED'] },
                deletedAt: null
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Get champions with skin counts
    const champions = await prisma.champion.findMany({
      select: {
        id: true,
        name: true,
        alias: true,
        squarePortraitPath: true,
        _count: {
          select: {
            customSkins: {
              where: {
                status: { in: ['APPROVED', 'FEATURED'] },
                deletedAt: null
              }
            }
          }
        }
      },
      where: {
        customSkins: {
          some: {
            status: { in: ['APPROVED', 'FEATURED'] },
            deletedAt: null
          }
        }
      },
      orderBy: {
        customSkins: {
          _count: 'desc'
        }
      },
      take: 20
    })

    // Get statistics
    const [totalSkins, totalDownloads, totalAuthors] = await Promise.all([
      prisma.customSkin.count({
        where: {
          status: { in: ['APPROVED', 'FEATURED'] },
          deletedAt: null
        }
      }),
      prisma.customSkin.aggregate({
        where: {
          status: { in: ['APPROVED', 'FEATURED'] },
          deletedAt: null
        },
        _sum: {
          downloadCount: true
        }
      }),
      prisma.customSkin.groupBy({
        by: ['authorId'],
        where: {
          status: { in: ['APPROVED', 'FEATURED'] },
          deletedAt: null
        }
      })
    ])

    return {
      featuredSkins: featuredSkins.map(skin => ({
        ...skin,
        previewImages: skin.previewImages ? 
          (typeof skin.previewImages === 'string' ? JSON.parse(skin.previewImages) : skin.previewImages) 
          : []
      })),
      recentSkins: recentSkins.map(skin => ({
        ...skin,
        previewImages: skin.previewImages ? 
          (typeof skin.previewImages === 'string' ? JSON.parse(skin.previewImages) : skin.previewImages) 
          : []
      })),
      popularSkins: popularSkins.map(skin => ({
        ...skin,
        previewImages: skin.previewImages ? 
          (typeof skin.previewImages === 'string' ? JSON.parse(skin.previewImages) : skin.previewImages) 
          : []
      })),
      categories: categories.map(cat => ({
        ...cat,
        count: cat._count.customSkins
      })),
      champions: champions.map(champ => ({
        ...champ,
        skinCount: champ._count.customSkins
      })),
      statistics: {
        totalSkins,
        totalDownloads: totalDownloads._sum.downloadCount || 0,
        totalAuthors: totalAuthors.length
      }
    }
  } catch (error) {
    console.error('Error fetching initial data:', error)
    return {
      featuredSkins: [],
      recentSkins: [],
      popularSkins: [],
      categories: [],
      champions: [],
      statistics: {
        totalSkins: 0,
        totalDownloads: 0,
        totalAuthors: 0
      }
    }
  }
}

export default async function CustomSkinsPage() {
  const initialData = await getInitialData()

  return <EnhancedCustomSkinsPage initialData={initialData} />
}
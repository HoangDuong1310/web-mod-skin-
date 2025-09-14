import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed script for Custom Skin Categories
 * Usage: npx tsx scripts/seed-skin-categories.ts
 */
async function seedSkinCategories() {
  console.log('🌱 Starting skin categories seeding...')

  try {
    // Create skin categories
    const skinCategories = [
      {
        id: 'custom-skins',
        name: 'Custom Skins',
        slug: 'custom-skins',
        description: 'Community created custom champion skins'
      },
      {
        id: 'theme-skins',
        name: 'Themed Skins',
        slug: 'theme-skins',
        description: 'Skins with specific themes like Dark Star, Project, etc.'
      },
      {
        id: 'vfx-skins',
        name: 'VFX Enhanced',
        slug: 'vfx-skins',
        description: 'Skins with custom visual effects and particles'
      },
      {
        id: 'chroma-skins',
        name: 'Chroma Variants',
        slug: 'chroma-skins',
        description: 'Color variant skins and chroma collections'
      },
      {
        id: 'anime-skins',
        name: 'Anime Style',
        slug: 'anime-skins', 
        description: 'Anime-inspired skin designs'
      },
      {
        id: 'fantasy-skins',
        name: 'Fantasy',
        slug: 'fantasy-skins',
        description: 'Fantasy themed skins with magical elements'
      },
      {
        id: 'cyberpunk-skins',
        name: 'Cyberpunk',
        slug: 'cyberpunk-skins',
        description: 'Futuristic cyberpunk themed skins'
      },
      {
        id: 'medieval-skins',
        name: 'Medieval',
        slug: 'medieval-skins',
        description: 'Medieval and knight themed skins'
      },
      {
        id: 'space-skins',
        name: 'Space/Cosmic',
        slug: 'space-skins',
        description: 'Space and cosmic themed skins'
      },
      {
        id: 'horror-skins',
        name: 'Horror',
        slug: 'horror-skins',
        description: 'Dark and horror themed skins'
      }
    ]

    let created = 0
    let updated = 0

    for (const category of skinCategories) {
      const result = await prisma.skinCategory.upsert({
        where: { id: category.id },
        update: {
          name: category.name,
          slug: category.slug,
          description: category.description
        },
        create: category,
      })

      if (result) {
        // Check if it was created or updated by trying to find existing
        const existing = await prisma.skinCategory.findFirst({
          where: { id: category.id }
        })
        if (existing) {
          updated++
        } else {
          created++
        }
      }
    }

    console.log(`✅ Skin categories processed: ${created} created, ${updated} updated`)
    console.log(`🎉 Total categories: ${skinCategories.length}`)

  } catch (error) {
    console.error('❌ Error seeding skin categories:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
if (require.main === module) {
  seedSkinCategories()
    .then(() => {
      console.log('🌱 Skin categories seeding completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Skin categories seeding failed:', error)
      process.exit(1)
    })
}

export { seedSkinCategories }
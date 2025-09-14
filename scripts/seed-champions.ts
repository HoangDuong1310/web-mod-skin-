import { PrismaClient } from '@prisma/client'
import championData from '../public/data/champion-summary.json'

const prisma = new PrismaClient()

/**
 * Seed script for Champions from Riot Games JSON data
 * Usage: npx tsx scripts/seed-champions.ts
 */
async function seedChampions() {
  console.log('🌱 Starting champions seeding...')
  console.log(`📊 Loading ${championData.length} champions from JSON data...`)

  try {
    let created = 0
    let updated = 0
    let skipped = 0

    for (const champ of championData) {
      // Skip the "None" champion (id: -1) and any invalid entries
      if (champ.id <= 0) {
        skipped++
        continue
      }

      try {
        const result = await prisma.champion.upsert({
          where: { id: champ.id },
          update: {
            name: champ.name,
            alias: champ.alias,
            description: champ.description || '',
            contentId: champ.contentId || '',
            squarePortraitPath: champ.squarePortraitPath || '',
            roles: JSON.stringify(champ.roles || [])
          },
          create: {
            id: champ.id,
            name: champ.name,
            alias: champ.alias,
            description: champ.description || '',
            contentId: champ.contentId || '',
            squarePortraitPath: champ.squarePortraitPath || '',
            roles: JSON.stringify(champ.roles || [])
          },
        })

        // Determine if created or updated
        if (result) {
          created++
        }

      } catch (championError) {
        console.warn(`⚠️ Warning: Failed to process champion ${champ.name} (ID: ${champ.id}):`, championError instanceof Error ? championError.message : String(championError))
        skipped++
      }
    }

    console.log(`✅ Champions processed:`)
    console.log(`   📝 Created/Updated: ${created}`)
    console.log(`   ⏭️ Skipped: ${skipped}`)
    console.log(`   🎯 Total processed: ${championData.length}`)

    // Verify champion count in database
    const totalChampions = await prisma.champion.count()
    console.log(`🗄️ Total champions in database: ${totalChampions}`)

    // Show some sample champions
    const sampleChampions = await prisma.champion.findMany({
      take: 5,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        alias: true,
        roles: true
      }
    })

    console.log('📋 Sample champions:')
    sampleChampions.forEach(champ => {
      const roles = JSON.parse(champ.roles as string || '[]')
      console.log(`   • ${champ.name} (${champ.alias}) - ID: ${champ.id} - Roles: ${roles.join(', ')}`)
    })

  } catch (error) {
    console.error('❌ Error seeding champions:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Get champion statistics from database
 */
async function getChampionStats() {
  try {
    const total = await prisma.champion.count()
    
    // Get all champions with their roles
    const champions = await prisma.champion.findMany({
      select: {
        roles: true
      }
    })

    console.log(`📊 Champion Statistics:`)
    console.log(`   Total: ${total} champions`)
    console.log(`   Role distribution:`)
    
    const roleStats: { [key: string]: number } = {}
    champions.forEach(champ => {
      const roles = JSON.parse(champ.roles as string || '[]')
      roles.forEach((role: string) => {
        roleStats[role] = (roleStats[role] || 0) + 1
      })
    })

    Object.entries(roleStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([role, count]) => {
        console.log(`     • ${role}: ${count}`)
      })

  } catch (error) {
    console.error('❌ Error getting champion stats:', error)
  }
}

// CLI options
const args = process.argv.slice(2)
const showStats = args.includes('--stats') || args.includes('-s')

// Run the seed function
if (require.main === module) {
  const runSeed = async () => {
    await seedChampions()
    
    if (showStats) {
      console.log('\n🔍 Fetching champion statistics...')
      await getChampionStats()
    }
    
    console.log('\n🌱 Champions seeding completed!')
    console.log('💡 Use --stats flag to see champion statistics')
  }

  runSeed()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Champions seeding failed:', error)
      process.exit(1)
    })
}

export { seedChampions, getChampionStats }
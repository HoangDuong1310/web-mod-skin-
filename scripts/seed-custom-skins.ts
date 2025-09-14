import { seedSkinCategories } from './seed-skin-categories'
import { seedChampions } from './seed-champions'

/**
 * Master seed script for Custom Skins system
 * Runs all related seed scripts in proper order
 * Usage: npx tsx scripts/seed-custom-skins.ts
 */
async function seedCustomSkins() {
  console.log('🎮 Starting Custom Skins system seeding...')
  console.log('═'.repeat(50))

  try {
    // Step 1: Seed skin categories
    console.log('\n📂 Step 1: Seeding skin categories...')
    await seedSkinCategories()

    // Step 2: Seed champions
    console.log('\n🏆 Step 2: Seeding champions...')
    await seedChampions()

    console.log('\n═'.repeat(50))
    console.log('🎉 Custom Skins system seeding completed successfully!')
    console.log('\n📋 What was seeded:')
    console.log('   ✅ Skin categories (10 categories)')
    console.log('   ✅ Champions (170+ from Riot Games data)')
    console.log('\n💡 Next steps:')
    console.log('   • Run main seed script for full data: npx prisma db seed')
    console.log('   • Or create custom skins manually via admin dashboard')
    console.log('   • API endpoints are ready for mobile app integration')

  } catch (error) {
    console.error('💥 Custom Skins seeding failed:', error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  seedCustomSkins()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error)
      process.exit(1)
    })
}

export { seedCustomSkins }
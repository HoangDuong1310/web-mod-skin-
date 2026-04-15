/**
 * Reset stuck package build status
 * Usage: npx tsx scripts/reset-package-status.ts
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const result = await prisma.setting.updateMany({
    where: {
      key: { in: ['league_skins_package_status', 'league_skins_package_progress', 'league_skins_package_error'] },
    },
    data: { value: '' },
  })

  // Set status specifically to 'none'
  await prisma.setting.upsert({
    where: { key: 'league_skins_package_status' },
    update: { value: 'none' },
    create: { key: 'league_skins_package_status', value: 'none', category: 'league-skins' },
  })

  console.log(`✅ Reset ${result.count} settings. Package status is now "none".`)
  console.log('You can now trigger a new build from the dashboard.')
  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error('❌ Failed:', err)
  await prisma.$disconnect()
  process.exit(1)
})

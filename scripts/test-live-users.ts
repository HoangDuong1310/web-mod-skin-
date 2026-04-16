/**
 * Script test: Insert fake active sessions to verify Live Users dashboard
 * 
 * Usage: npx ts-node scripts/test-live-users.ts
 * Or: npx tsx scripts/test-live-users.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const FAKE_SESSIONS = [
  {
    licenseKey: 'TEST-AAAA-BBBB-CCCC',
    hwid: 'test-hwid-001',
    appVersion: '1.0.2',
    phase: 'InProgress',
    gameMode: 'CLASSIC',
    champion: 'Ahri',
    championId: 103,
    skin: 'Ahri Vệ Binh Tinh Tú',
    skinId: 103015,
    summonerName: 'TestPlayer1',
    region: 'VN2',
    partyMode: false,
    uptimeMinutes: 45,
    injectionCount: 3,
    lastInjectionSkin: 'Ahri Vệ Binh Tinh Tú',
  },
  {
    licenseKey: 'TEST-DDDD-EEEE-FFFF',
    hwid: 'test-hwid-002',
    appVersion: '1.0.2',
    phase: 'ChampSelect',
    gameMode: 'CLASSIC',
    champion: 'Yasuo',
    championId: 157,
    skin: 'Yasuo Dark Star',
    skinId: 157010,
    summonerName: 'TestPlayer2',
    region: 'VN2',
    partyMode: true,
    uptimeMinutes: 120,
    injectionCount: 7,
    lastInjectionSkin: 'Yasuo Dark Star',
  },
  {
    licenseKey: 'TEST-GGGG-HHHH-IIII',
    hwid: 'test-hwid-003',
    appVersion: '1.0.1',
    phase: null,
    gameMode: null,
    champion: null,
    championId: null,
    skin: null,
    skinId: null,
    summonerName: 'TestPlayer3',
    region: 'NA1',
    partyMode: false,
    uptimeMinutes: 10,
    injectionCount: 0,
    lastInjectionSkin: null,
  },
  {
    licenseKey: 'TEST-JJJJ-KKKK-LLLL',
    hwid: 'test-hwid-004',
    appVersion: '1.0.2',
    phase: 'Lobby',
    gameMode: 'ARAM',
    champion: null,
    championId: null,
    skin: null,
    skinId: null,
    summonerName: 'TestPlayer4',
    region: 'VN2',
    partyMode: false,
    uptimeMinutes: 30,
    injectionCount: 1,
    lastInjectionSkin: 'Lux Cosmic Prismatic',
  },
]

async function main() {
  console.log('🔄 Inserting fake active sessions...')

  for (const session of FAKE_SESSIONS) {
    await prisma.activeSession.upsert({
      where: {
        licenseKey_hwid: {
          licenseKey: session.licenseKey,
          hwid: session.hwid,
        },
      },
      create: {
        ...session,
        sessionStart: new Date(),
        lastHeartbeat: new Date(),
      },
      update: {
        ...session,
        lastHeartbeat: new Date(),
      },
    })
    console.log(`  ✅ ${session.summonerName} (${session.phase || 'Idle'})`)
  }

  console.log(`\n✅ Inserted ${FAKE_SESSIONS.length} fake sessions.`)
  console.log('📊 Open /dashboard or /dashboard/live-users to see them.')
  console.log('\n⚠️  Sessions will auto-expire after 5 minutes without heartbeat update.')
  console.log('🧹 To clean up: npx tsx scripts/test-live-users.ts --cleanup')

  // Check for cleanup flag
  if (process.argv.includes('--cleanup')) {
    console.log('\n🧹 Cleaning up fake sessions...')
    const deleted = await prisma.activeSession.deleteMany({
      where: {
        licenseKey: { startsWith: 'TEST-' },
      },
    })
    console.log(`  Deleted ${deleted.count} test sessions.`)
  }

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Error:', e)
  prisma.$disconnect()
  process.exit(1)
})

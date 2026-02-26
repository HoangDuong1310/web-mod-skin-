/**
 * Seed All - Chạy tất cả seed scripts theo đúng thứ tự dependency
 *
 * Usage:
 *   npx tsx scripts/seed-all.ts          # Chạy tất cả
 *   npx tsx scripts/seed-all.ts --skip-main  # Bỏ qua main seed, chỉ chạy scripts phụ
 *   npx tsx scripts/seed-all.ts --only banners plans  # Chỉ chạy một số scripts
 */

import { execSync } from 'child_process'
import path from 'path'

const ROOT_DIR = path.resolve(__dirname, '..')

interface SeedStep {
  name: string
  command: string
  description: string
  isMain?: boolean
}

// Thứ tự seed theo dependency (quan trọng!)
const SEED_STEPS: SeedStep[] = [
  // Phase 1: Dữ liệu nền tảng (không phụ thuộc gì)
  {
    name: 'skin-categories',
    command: 'npx tsx scripts/seed-skin-categories.ts',
    description: 'Skin categories (10 loại)',
  },
  {
    name: 'champions',
    command: 'npx tsx scripts/seed-champions.ts',
    description: 'Champions (170 tướng từ Data Dragon)',
  },
  {
    name: 'plans',
    command: 'npx tsx scripts/seed-plans.ts',
    description: 'Subscription plans (gói cước)',
  },

  // Phase 2: Main seed (cần champions cho custom skins)
  {
    name: 'main',
    command: 'npx prisma db seed',
    description: 'Main seed (users, categories, products, reviews, tags, posts, downloads, custom skins)',
    isMain: true,
  },

  // Phase 3: Dữ liệu bổ sung (có thể cần users/plans từ main seed)
  {
    name: 'banners',
    command: 'npx tsx scripts/seed-banners.ts',
    description: 'Banners (5 banners)',
  },
  {
    name: 'free-key-plan',
    command: 'npx tsx scripts/seed-free-key-plan.ts',
    description: 'Free key 4-hour plan',
  },
  {
    name: 'donations',
    command: 'npx tsx scripts/seed-donations.ts',
    description: 'Donation goals & sample donations',
  },
  {
    name: 'custom-skins',
    command: 'npx tsx scripts/seed-custom-skins.ts',
    description: 'Custom skins bổ sung',
  },
  {
    name: 'mod-skin-tutorial',
    command: 'npx tsx scripts/seed-mod-skin-v2-tutorial.ts',
    description: 'Mod Skin V2 tutorial post',
  },
]

function runStep(step: SeedStep): boolean {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`📦 [${step.name}] ${step.description}`)
  console.log('='.repeat(60))

  try {
    execSync(step.command, {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      env: { ...process.env },
    })
    console.log(`✅ [${step.name}] Thành công!`)
    return true
  } catch (error) {
    console.error(`❌ [${step.name}] Thất bại!`)
    return false
  }
}

function main() {
  const args = process.argv.slice(2)
  const skipMain = args.includes('--skip-main')
  const onlyIndex = args.indexOf('--only')
  const onlySteps = onlyIndex >= 0 ? args.slice(onlyIndex + 1) : null

  console.log('🚀 ===== SEED ALL - Khởi tạo toàn bộ dữ liệu =====')
  console.log(`📅 ${new Date().toLocaleString('vi-VN')}`)

  let stepsToRun = SEED_STEPS

  if (onlySteps && onlySteps.length > 0) {
    stepsToRun = SEED_STEPS.filter((s) => onlySteps.includes(s.name))
    console.log(`\n🎯 Chỉ chạy: ${stepsToRun.map((s) => s.name).join(', ')}`)
  } else if (skipMain) {
    stepsToRun = SEED_STEPS.filter((s) => !s.isMain)
    console.log('\n⏭️  Bỏ qua main seed')
  }

  console.log(`\n📋 Sẽ chạy ${stepsToRun.length} seed steps:`)
  stepsToRun.forEach((s, i) => {
    console.log(`   ${i + 1}. ${s.name} - ${s.description}`)
  })

  const results: { name: string; success: boolean }[] = []

  for (const step of stepsToRun) {
    const success = runStep(step)
    results.push({ name: step.name, success })
  }

  // Tổng kết
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 KẾT QUẢ TỔNG HỢP')
  console.log('='.repeat(60))

  const succeeded = results.filter((r) => r.success)
  const failed = results.filter((r) => !r.success)

  succeeded.forEach((r) => console.log(`   ✅ ${r.name}`))
  failed.forEach((r) => console.log(`   ❌ ${r.name}`))

  console.log(`\n📈 Thành công: ${succeeded.length}/${results.length}`)

  if (failed.length > 0) {
    console.log(`\n⚠️  ${failed.length} steps thất bại. Chạy lại với:`)
    console.log(`   npx tsx scripts/seed-all.ts --only ${failed.map((r) => r.name).join(' ')}`)
    process.exit(1)
  } else {
    console.log('\n🎉 Tất cả seed hoàn tất thành công!')
  }
}

main()

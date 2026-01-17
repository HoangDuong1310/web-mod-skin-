/**
 * Seed Subscription Plans
 * Tạo các gói cước mẫu
 * 
 * Run: npm run seed:plans
 * hoặc: npx tsx scripts/seed-plans.ts
 */

import { prisma } from '../lib/prisma'

const plans = [
  {
    name: '1 Ngày',
    nameEn: '1 Day',
    slug: '1-day',
    description: 'Dùng thử trong 1 ngày',
    descriptionEn: 'Try for 1 day',
    price: 10000,
    comparePrice: null,
    currency: 'VND',
    priceUsd: 0.50,
    comparePriceUsd: null,
    durationType: 'DAY' as const,
    durationValue: 1,
    features: JSON.stringify([
      'Đầy đủ tính năng',
      '1 thiết bị',
      'Hỗ trợ qua Discord',
    ]),
    featuresEn: JSON.stringify([
      'Full features',
      '1 device',
      'Discord support',
    ]),
    maxDevices: 1,
    isActive: true,
    isPopular: false,
    isFeatured: false,
    priority: 1,
  },
  {
    name: '7 Ngày',
    nameEn: '7 Days',
    slug: '7-days',
    description: 'Gói tuần - Tiết kiệm 30%',
    descriptionEn: 'Weekly plan - Save 30%',
    price: 50000,
    comparePrice: 70000,
    currency: 'VND',
    priceUsd: 2.50,
    comparePriceUsd: 3.50,
    durationType: 'WEEK' as const,
    durationValue: 1,
    features: JSON.stringify([
      'Đầy đủ tính năng',
      '1 thiết bị',
      'Hỗ trợ qua Discord',
      'Cập nhật miễn phí',
    ]),
    featuresEn: JSON.stringify([
      'Full features',
      '1 device',
      'Discord support',
      'Free updates',
    ]),
    maxDevices: 1,
    isActive: true,
    isPopular: false,
    isFeatured: false,
    priority: 2,
  },
  {
    name: '1 Tháng',
    nameEn: '1 Month',
    slug: '1-month',
    description: 'Gói tháng - Phổ biến nhất',
    descriptionEn: 'Monthly plan - Most popular',
    price: 150000,
    comparePrice: 200000,
    currency: 'VND',
    priceUsd: 7.00,
    comparePriceUsd: 10.00,
    durationType: 'MONTH' as const,
    durationValue: 1,
    features: JSON.stringify([
      'Đầy đủ tính năng',
      '2 thiết bị',
      'Hỗ trợ ưu tiên',
      'Cập nhật miễn phí',
      'Không quảng cáo',
    ]),
    featuresEn: JSON.stringify([
      'Full features',
      '2 devices',
      'Priority support',
      'Free updates',
      'No ads',
    ]),
    maxDevices: 2,
    isActive: true,
    isPopular: true,
    isFeatured: false,
    priority: 10,
    color: '#3b82f6',
  },
  {
    name: '3 Tháng',
    nameEn: '3 Months',
    slug: '3-months',
    description: 'Gói quý - Tiết kiệm 20%',
    descriptionEn: 'Quarterly plan - Save 20%',
    price: 360000,
    comparePrice: 450000,
    currency: 'VND',
    priceUsd: 18.00,
    comparePriceUsd: 21.00,
    durationType: 'QUARTER' as const,
    durationValue: 1,
    features: JSON.stringify([
      'Đầy đủ tính năng',
      '2 thiết bị',
      'Hỗ trợ ưu tiên',
      'Cập nhật miễn phí',
      'Không quảng cáo',
      'Tính năng Beta sớm',
    ]),
    featuresEn: JSON.stringify([
      'Full features',
      '2 devices',
      'Priority support',
      'Free updates',
      'No ads',
      'Early Beta access',
    ]),
    maxDevices: 2,
    isActive: true,
    isPopular: false,
    isFeatured: true,
    priority: 5,
  },
  {
    name: '1 Năm',
    nameEn: '1 Year',
    slug: '1-year',
    description: 'Gói năm - Tiết kiệm 40%',
    descriptionEn: 'Yearly plan - Save 40%',
    price: 1080000,
    comparePrice: 1800000,
    currency: 'VND',
    priceUsd: 50.00,
    comparePriceUsd: 84.00,
    durationType: 'YEAR' as const,
    durationValue: 1,
    features: JSON.stringify([
      'Đầy đủ tính năng',
      '3 thiết bị',
      'Hỗ trợ VIP 24/7',
      'Cập nhật miễn phí',
      'Không quảng cáo',
      'Tính năng Beta sớm',
      'Bonus 1 tháng miễn phí',
    ]),
    featuresEn: JSON.stringify([
      'Full features',
      '3 devices',
      'VIP 24/7 support',
      'Free updates',
      'No ads',
      'Early Beta access',
      '1 month free bonus',
    ]),
    maxDevices: 3,
    isActive: true,
    isPopular: false,
    isFeatured: false,
    priority: 4,
  },
  {
    name: 'Vĩnh viễn',
    nameEn: 'Lifetime',
    slug: 'lifetime',
    description: 'Mua 1 lần, dùng mãi mãi',
    descriptionEn: 'Pay once, use forever',
    price: 2500000,
    comparePrice: 5000000,
    currency: 'VND',
    priceUsd: 120.00,
    comparePriceUsd: 200.00,
    durationType: 'LIFETIME' as const,
    durationValue: 1,
    features: JSON.stringify([
      'Đầy đủ tính năng mãi mãi',
      '5 thiết bị',
      'Hỗ trợ VIP 24/7',
      'Tất cả cập nhật tương lai',
      'Không quảng cáo',
      'Tất cả tính năng Beta',
      'Badge VIP trên Discord',
      'Ưu tiên request tính năng',
    ]),
    featuresEn: JSON.stringify([
      'Full features forever',
      '5 devices',
      'VIP 24/7 support',
      'All future updates',
      'No ads',
      'All Beta features',
      'VIP Discord badge',
      'Feature request priority',
    ]),
    maxDevices: 5,
    isActive: true,
    isPopular: false,
    isFeatured: false,
    priority: 3,
    color: '#f59e0b',
  },
]

async function main() {
  console.log('🌱 Seeding subscription plans...\n')
  
  for (const plan of plans) {
    const existing = await prisma.subscriptionPlan.findUnique({
      where: { slug: plan.slug },
    })
    
    if (existing) {
      console.log(`⏭️  Plan "${plan.name}" already exists, updating...`)
      await prisma.subscriptionPlan.update({
        where: { slug: plan.slug },
        data: plan,
      })
    } else {
      console.log(`✅ Creating plan "${plan.name}"...`)
      await prisma.subscriptionPlan.create({
        data: plan,
      })
    }
  }
  
  console.log('\n🎉 Subscription plans seeded successfully!')
  
  // Summary
  const allPlans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { priority: 'desc' },
  })
  
  console.log('\n📋 Active plans:')
  allPlans.forEach(p => {
    console.log(`   • ${p.name} - ${Number(p.price).toLocaleString('vi-VN')} ${p.currency}`)
  })
}

main()
  .catch((e) => {
    console.error('❌ Error seeding plans:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

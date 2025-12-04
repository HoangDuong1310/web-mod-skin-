import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed script for Banners
 * Usage: npx tsx scripts/seed-banners.ts
 */
async function seedBanners() {
  console.log('🌱 Starting banners seeding...')

  try {
    const banners = [
      {
        title: '🔴 Đang Livestream! Hướng dẫn cài đặt Skin mới nhất',
        content: 'Tham gia ngay để được hỗ trợ trực tiếp và nhận skin độc quyền',
        linkUrl: 'https://youtube.com/@YourChannel/live',
        linkText: 'Xem ngay',
        type: 'LIVESTREAM' as const,
        position: 'TOP' as const,
        isActive: false, // Set true when livestreaming
        isDismissible: true,
        showOnMobile: true,
        priority: 100,
        targetAudience: 'ALL' as const,
        appVisible: true,
        appData: JSON.stringify({
          deepLink: 'webmodskin://livestream',
          showAsNotification: true,
          notificationTitle: '🔴 Livestream đang diễn ra!',
          notificationBody: 'Nhấn để tham gia ngay và nhận skin miễn phí',
        }),
        backgroundColor: '#dc2626',
        textColor: '#ffffff',
      },
      {
        title: '🎁 Cập nhật mới! 50+ Skin mới cho mùa 2025',
        content: 'Khám phá bộ sưu tập skin độc quyền dành riêng cho cộng đồng',
        linkUrl: '/custom-skins',
        linkText: 'Khám phá',
        type: 'PROMOTION' as const,
        position: 'TOP' as const,
        isActive: true,
        isDismissible: true,
        showOnMobile: true,
        priority: 50,
        targetAudience: 'ALL' as const,
        appVisible: true,
        appData: JSON.stringify({
          deepLink: 'webmodskin://skins/new',
        }),
        backgroundColor: '#7c3aed',
        textColor: '#ffffff',
      },
      {
        title: '💝 Ủng hộ dự án',
        content: 'Cảm ơn bạn đã sử dụng WebModSkin! Ủng hộ chúng tôi để duy trì server',
        linkUrl: '/donate',
        linkText: 'Donate ngay',
        type: 'INFO' as const,
        position: 'MODAL' as const,
        isActive: false,
        isDismissible: true,
        showOnMobile: true,
        priority: 10,
        targetAudience: 'AUTHENTICATED' as const,
        appVisible: true,
        appData: JSON.stringify({
          deepLink: 'webmodskin://donate',
          showAsNotification: false,
        }),
        backgroundColor: '#ec4899',
        textColor: '#ffffff',
      },
      {
        title: '⚠️ Bảo trì hệ thống',
        content: 'Hệ thống sẽ bảo trì từ 2:00 - 4:00 AM ngày mai. Xin lỗi vì sự bất tiện',
        type: 'WARNING' as const,
        position: 'TOP' as const,
        isActive: false,
        isDismissible: true,
        showOnMobile: true,
        priority: 200,
        targetAudience: 'ALL' as const,
        appVisible: true,
        backgroundColor: '#f59e0b',
        textColor: '#000000',
      },
      {
        title: '🎮 Sự kiện đặc biệt! Giải đấu Skin Creator',
        content: 'Tham gia tạo skin và có cơ hội nhận giải thưởng hấp dẫn',
        linkUrl: '/blog/skin-creator-contest',
        linkText: 'Tham gia ngay',
        type: 'EVENT' as const,
        position: 'MODAL' as const,
        isActive: false,
        isDismissible: true,
        showOnMobile: true,
        priority: 80,
        targetAudience: 'ALL' as const,
        appVisible: true,
        appData: JSON.stringify({
          deepLink: 'webmodskin://event/skin-contest',
          showAsNotification: true,
          notificationTitle: '🎮 Sự kiện mới!',
          notificationBody: 'Giải đấu Skin Creator đang diễn ra',
        }),
        backgroundColor: '#f97316',
        textColor: '#ffffff',
      },
    ]

    let created = 0
    for (const banner of banners) {
      await prisma.banner.create({
        data: banner,
      })
      created++
      console.log(`✅ Created banner: ${banner.title}`)
    }

    console.log(`\n🎉 Successfully created ${created} banners!`)

  } catch (error) {
    console.error('❌ Error seeding banners:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
if (require.main === module) {
  seedBanners()
    .then(() => {
      console.log('🌱 Banners seeding completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Banners seeding failed:', error)
      process.exit(1)
    })
}

export { seedBanners }

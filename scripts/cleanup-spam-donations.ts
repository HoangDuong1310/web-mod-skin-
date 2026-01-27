/**
 * Script để xóa spam donations từ database
 * Chạy: npx ts-node scripts/cleanup-spam-donations.ts
 */

import { prisma } from '../lib/prisma'

async function cleanupSpamDonations() {
  console.log('🧹 Bắt đầu xóa spam donations...\n')

  // Tìm các spam donations dựa trên pattern
  const spamDonations = await prisma.donation.findMany({
    where: {
      OR: [
        // Xóa những donation có amount cực cao bất thường (> 10000)
        {
          amount: {
            gt: 10000
          }
        },
        // Xóa những donation có tên rất dài (spam pattern - > 100 ký tự)
        {
          donorName: {
            gte: 'N'.repeat(101) // Tên có từ 101 chữ N trở lên
          }
        },
        // Xóa những donation có email đáng ngờ
        {
          donorEmail: {
            endsWith: '@toolgamepc.com'
          }
        }
      ],
      // Chỉ xóa những donation có status COMPLETED và paymentMethod MANUAL
      // (đây là pattern của attacker)
      status: 'COMPLETED',
      paymentMethod: 'MANUAL'
    }
  })

  console.log(`📊 Tìm thấy ${spamDonations.length} spam donations\n`)

  if (spamDonations.length === 0) {
    console.log('✅ Không có spam donations để xóa!')
    return
  }

  // Hiển thị thông tin spam donations
  console.log('Thông tin spam donations:')
  console.log('------------------------')
  spamDonations.forEach(d => {
    console.log(`ID: ${d.id}`)
    console.log(`  Amount: $${d.amount}`)
    console.log(`  Name: ${d.donorName}`)
    console.log(`  Email: ${d.donorEmail}`)
    console.log(`  Status: ${d.status}`)
    console.log(`  Created: ${d.createdAt}`)
    console.log('------------------------')
  })

  // Xóa spam donations
  const deletedCount = await prisma.donation.deleteMany({
    where: {
      id: {
        in: spamDonations.map(d => d.id)
      }
    }
  })

  console.log(`\n✅ Đã xóa ${deletedCount.count} spam donations!`)

  // Thống kê lại
  const totalDonations = await prisma.donation.count()
  console.log(`\n📈 Tổng số donations còn lại: ${totalDonations}`)
}

cleanupSpamDonations()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })

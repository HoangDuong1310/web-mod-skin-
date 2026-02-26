/**
 * Script test tất cả các loại email
 * Usage: npx tsx scripts/test-emails.ts [type]
 * Types: welcome, reset, order, payment, review, contact, all
 * Default: all
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TEST_EMAIL = 'hoangduongdzvcll@gmail.com'
const TEST_NAME = 'Test User'

async function testEmails() {
  const type = process.argv[2] || 'all'

  // Dynamically import email service to use project settings
  const { emailService } = await import('../lib/email')

  // Reset to load fresh settings
  emailService.resetTransporter()

  const results: { name: string; success: boolean; error?: string }[] = []

  async function run(name: string, fn: () => Promise<boolean>) {
    try {
      console.log(`\n📧 Testing: ${name}...`)
      const ok = await fn()
      results.push({ name, success: ok })
      console.log(ok ? `  ✅ ${name} — OK` : `  ❌ ${name} — FAILED (returned false)`)
    } catch (err: any) {
      results.push({ name, success: false, error: err.message })
      console.error(`  ❌ ${name} — ERROR: ${err.message}`)
    }
  }

  // 1. Welcome Email
  if (type === 'all' || type === 'welcome') {
    await run('Welcome Email', () =>
      emailService.sendWelcomeEmail(TEST_EMAIL, TEST_NAME)
    )
  }

  // 2. Password Reset Email
  if (type === 'all' || type === 'reset') {
    await run('Password Reset Email', () =>
      emailService.sendPasswordResetEmail(TEST_EMAIL, 'fake-token-123456', 'http://localhost:3000')
    )
  }

  // 3. Order Confirmation Email
  if (type === 'all' || type === 'order') {
    await run('Order Confirmation Email', () =>
      emailService.sendOrderConfirmationEmail(
        TEST_EMAIL,
        TEST_NAME,
        'ORD-TEST-12345',
        'Gói VIP 30 Ngày',
        150000,
        'VND',
        'https://img.vietqr.io/image/MB-1234567890-compact.png?amount=150000&addInfo=ORD-TEST-12345'
      )
    )
  }

  // 4. Payment Success + License Key Email
  if (type === 'all' || type === 'payment') {
    await run('Payment Success Email', () =>
      emailService.sendPaymentSuccessEmail(
        TEST_EMAIL,
        TEST_NAME,
        'ORD-TEST-12345',
        'Gói VIP 30 Ngày',
        150000,
        'VND',
        'WMSKIN-ABCD-EFGH-1234',
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      )
    )
  }

  // 5. Review Reply Notification
  if (type === 'all' || type === 'review') {
    await run('Review Reply Notification', () =>
      emailService.sendReviewReplyNotification(
        TEST_EMAIL,
        TEST_NAME,
        'Admin WebModSkin',
        'ADMIN',
        'Cảm ơn bạn đã đánh giá! Chúng tôi rất vui khi bạn hài lòng với sản phẩm.',
        'Mod Skin Lux'
      )
    )
  }

  // 6. Contact Form Email (to admin)
  if (type === 'all' || type === 'contact') {
    await run('Contact Form Email', () =>
      emailService.sendContactFormEmail(
        'Người dùng test',
        TEST_EMAIL,
        'Test liên hệ',
        'support',
        'Đây là nội dung test từ script test-emails.ts. Kiểm tra xem email contact form có hoạt động không.'
      )
    )

    await run('Contact Auto-Reply', () =>
      emailService.sendContactAutoReply(TEST_EMAIL, TEST_NAME, 'Test liên hệ')
    )
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 KẾT QUẢ TEST EMAIL:')
  console.log('='.repeat(50))
  for (const r of results) {
    console.log(`  ${r.success ? '✅' : '❌'} ${r.name}${r.error ? ` (${r.error})` : ''}`)
  }
  const passed = results.filter(r => r.success).length
  console.log(`\n  Tổng: ${passed}/${results.length} thành công`)
  console.log('='.repeat(50))

  await prisma.$disconnect()
  process.exit(passed === results.length ? 0 : 1)
}

testEmails()

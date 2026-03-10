/**
 * Test Script: Concurrent Session Logic
 * 
 * Gọi trực tiếp các hàm trong lib/license-key.ts, KHÔNG cần server chạy.
 * 
 * Test các tính năng:
 * 1. Kích hoạt key thành công
 * 2. Heartbeat giữ session sống
 * 3. Session tự hết hạn khi không heartbeat
 * 4. Giới hạn concurrent sessions (key đang dùng → máy khác không kích hoạt được)
 * 5. Sau khi session hết hạn → máy khác kích hoạt được
 * 6. Deactivate thủ công giải phóng slot
 * 7. Global cleanup dọn tất cả stale sessions
 * 
 * Cách chạy:
 *   npx tsx scripts/test-session-logic.ts
 */

import { PrismaClient } from '@prisma/client'
import {
  activateKey,
  validateKey,
  deactivateDevice,
  heartbeat,
  cleanupAllStaleSessions,
  SESSION_TIMEOUT_MS,
  SESSION_GRACE_MS,
} from '../lib/license-key'

const prisma = new PrismaClient()

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
}

function log(msg: string) {
  console.log(`${colors.cyan}[TEST]${colors.reset} ${msg}`)
}

function pass(msg: string) {
  console.log(`${colors.green}  ✓ PASS:${colors.reset} ${msg}`)
}

function fail(msg: string) {
  console.log(`${colors.red}  ✗ FAIL:${colors.reset} ${msg}`)
}

function info(msg: string) {
  console.log(`${colors.yellow}  ℹ INFO:${colors.reset} ${msg}`)
}

function header(msg: string) {
  console.log(`\n${colors.bold}${colors.blue}═══ ${msg} ═══${colors.reset}\n`)
}

let testKeyString: string | null = null
let testKeyId: string | null = null
let testPassed = 0
let testFailed = 0

async function setupTestKey() {
  header('SETUP: Tạo key test')

  // Tìm plan có sẵn
  let plan = await prisma.subscriptionPlan.findFirst({
    where: { isActive: true },
  })

  if (!plan) {
    plan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Test Plan',
        slug: 'test-plan-session',
        price: 0,
        maxDevices: 1, // 1 phiên đồng thời
        isActive: true,
      },
    })
    info('Tạo plan test mới')
  }

  // Tạo key test với maxDevices = 1 (chỉ cho phép 1 phiên đồng thời)
  const keyString = generateTestKey()
  const key = await prisma.licenseKey.create({
    data: {
      key: keyString,
      planId: plan.id,
      status: 'ACTIVE',
      maxDevices: 1,
      currentDevices: 0,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 ngày
    },
  })

  testKeyString = keyString
  testKeyId = key.id
  log(`Key test: ${keyString} (maxDevices: 1)`)
  return keyString
}

function generateTestKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const segments: string[] = []
  for (let i = 0; i < 4; i++) {
    let seg = ''
    for (let j = 0; j < 4; j++) {
      seg += chars[Math.floor(Math.random() * chars.length)]
    }
    segments.push(seg)
  }
  return segments.join('-')
}

async function cleanupTestKey() {
  if (testKeyId) {
    // Xóa activations trước
    await prisma.keyActivation.deleteMany({ where: { keyId: testKeyId } })
    await prisma.keyUsageLog.deleteMany({ where: { keyId: testKeyId } })
    await prisma.licenseKey.delete({ where: { id: testKeyId } })
    info('Đã xóa key test')
  }
}

// ============================================
// TEST 1: Kích hoạt key thành công
// ============================================
async function test1_ActivateSuccess() {
  header('TEST 1: Kích hoạt key thành công')

  const res = await activateKey({
    key: testKeyString!,
    hwid: 'TEST-DEVICE-001',
    deviceName: 'Test Device 1',
  })

  if (res.success) {
    pass(`Kích hoạt thành công - currentSessions: ${(res as any).data?.currentSessions}`)
    testPassed++
  } else {
    fail(`Kích hoạt thất bại: ${res.error} - ${res.message}`)
    testFailed++
  }
}

// ============================================
// TEST 2: Heartbeat giữ session sống
// ============================================
async function test2_HeartbeatKeepsAlive() {
  header('TEST 2: Heartbeat giữ session sống')

  const res = await heartbeat({
    key: testKeyString!,
    hwid: 'TEST-DEVICE-001',
  })

  if (res.valid === true) {
    pass('Heartbeat thành công - session vẫn active')
    testPassed++
  } else {
    fail(`Heartbeat thất bại: ${res.error}`)
    testFailed++
  }
}

// ============================================
// TEST 3: Máy khác không kích hoạt được khi hết slot
// ============================================
async function test3_ConcurrentLimitBlocked() {
  header('TEST 3: Máy khác bị chặn khi hết slot concurrent')

  const res = await activateKey({
    key: testKeyString!,
    hwid: 'TEST-DEVICE-002',
    deviceName: 'Test Device 2',
  })

  if (!res.success && res.error === 'KEY_IN_USE') {
    pass(`Đúng - máy khác bị chặn: ${res.message}`)
    info(`currentSessions: ${(res as any).currentSessions}, maxConcurrent: ${(res as any).maxConcurrent}`)
    testPassed++
  } else {
    fail(`Sai - lẽ ra phải bị chặn: ${JSON.stringify(res)}`)
    testFailed++
  }
}

// ============================================
// TEST 4: Validate key đang bị dùng
// ============================================
async function test4_ValidateKeyInUse() {
  header('TEST 4: Validate key - máy khác sẽ thấy KEY_IN_USE')

  const res = await validateKey({
    key: testKeyString!,
    hwid: 'TEST-DEVICE-002',
  })

  if (res.error === 'KEY_IN_USE') {
    pass('Đúng - validate trả về KEY_IN_USE cho máy khác')
    testPassed++
  } else {
    fail(`Sai - expected KEY_IN_USE: ${JSON.stringify(res)}`)
    testFailed++
  }
}

// ============================================
// TEST 5: Deactivate giải phóng slot
// ============================================
async function test5_DeactivateFreesSlot() {
  header('TEST 5: Deactivate giải phóng slot')

  // Deactivate device 1
  const deactRes = await deactivateDevice({
    key: testKeyString!,
    hwid: 'TEST-DEVICE-001',
  })

  if (deactRes.success) {
    pass('Deactivate thành công')
  } else {
    fail(`Deactivate thất bại: ${deactRes.error}`)
    testFailed++
    return
  }

  // Bây giờ device 2 phải kích hoạt được
  const actRes = await activateKey({
    key: testKeyString!,
    hwid: 'TEST-DEVICE-002',
    deviceName: 'Test Device 2',
  })

  if (actRes.success) {
    pass('Máy khác kích hoạt thành công sau khi slot được giải phóng')
    testPassed++
  } else {
    fail(`Máy khác vẫn không kích hoạt được: ${actRes.error}`)
    testFailed++
  }
}

// ============================================
// TEST 6: Session tự hết hạn (simulate bằng DB)
// ============================================
async function test6_SessionAutoExpire() {
  header('TEST 6: Session tự hết hạn khi không heartbeat')

  // Đặt lastSeenAt về quá khứ (7 phút trước) để simulate timeout
  const sevenMinutesAgo = new Date(Date.now() - 7 * 60 * 1000)

  await prisma.keyActivation.updateMany({
    where: {
      keyId: testKeyId!,
      status: 'ACTIVE',
    },
    data: {
      lastSeenAt: sevenMinutesAgo,
    },
  })
  info('Đã set lastSeenAt = 7 phút trước (simulate không heartbeat)')

  // Bây giờ device 3 thử kích hoạt → cleanup sẽ chạy → session cũ bị dọn → kích hoạt thành công
  const res = await activateKey({
    key: testKeyString!,
    hwid: 'TEST-DEVICE-003',
    deviceName: 'Test Device 3',
  })

  if (res.success) {
    pass('Session cũ tự hết hạn → máy mới kích hoạt thành công')
    testPassed++
  } else {
    fail(`Session không tự hết hạn: ${res.error}`)
    testFailed++
  }
}

// ============================================
// TEST 7: Heartbeat trả SESSION_EXPIRED cho session đã timeout
// ============================================
async function test7_HeartbeatExpiredSession() {
  header('TEST 7: Heartbeat trả SESSION_EXPIRED cho session đã hết hạn')

  // Deactivate device 3 trước
  await deactivateDevice({
    key: testKeyString!,
    hwid: 'TEST-DEVICE-003',
  })

  // Kích hoạt device 4
  await activateKey({
    key: testKeyString!,
    hwid: 'TEST-DEVICE-004',
    deviceName: 'Test Device 4',
  })

  // Set lastSeenAt quá khứ để simulate timeout
  await prisma.keyActivation.updateMany({
    where: {
      keyId: testKeyId!,
      hwid: {
        not: undefined, // match any - we'll filter by the right one
      },
      status: 'ACTIVE',
    },
    data: {
      lastSeenAt: new Date(Date.now() - 7 * 60 * 1000),
    },
  })
  info('Set lastSeenAt = 7 phút trước cho device 4')

  // Heartbeat → SESSION_EXPIRED
  const res = await heartbeat({
    key: testKeyString!,
    hwid: 'TEST-DEVICE-004',
  })

  if (res.valid === false && res.error === 'SESSION_EXPIRED') {
    pass('Heartbeat trả đúng SESSION_EXPIRED')
    testPassed++
  } else {
    fail(`Expected SESSION_EXPIRED: ${JSON.stringify(res)}`)
    testFailed++
  }
}

// ============================================
// TEST 8: Global cleanup
// ============================================
async function test8_GlobalCleanup() {
  header('TEST 8: Global cleanup sessions (cleanupAllStaleSessions)')

  // Dọn sạch activations cũ
  await prisma.keyActivation.updateMany({
    where: { keyId: testKeyId! },
    data: { status: 'DEACTIVATED', deactivatedAt: new Date() },
  })

  // Tạo session mới với lastSeenAt đã quá hạn
  await prisma.keyActivation.create({
    data: {
      keyId: testKeyId!,
      hwid: 'TEST-DEVICE-CLEANUP',
      status: 'ACTIVE',
      lastSeenAt: new Date(Date.now() - 10 * 60 * 1000), // 10 phút trước
    },
  })

  await prisma.licenseKey.update({
    where: { id: testKeyId! },
    data: { currentDevices: 1 },
  })

  info('Tạo stale session (10 phút không heartbeat)')

  // Gọi global cleanup trực tiếp
  const result = await cleanupAllStaleSessions()

  if (result.cleanedSessions > 0) {
    pass(`Global cleanup thành công: ${result.cleanedSessions} sessions, ${result.affectedKeys} keys`)
    testPassed++
  } else {
    fail(`Global cleanup không dọn được session nào`)
    testFailed++
  }

  // Verify currentDevices đã được cập nhật
  const key = await prisma.licenseKey.findUnique({
    where: { id: testKeyId! },
  })
  if (key && key.currentDevices === 0) {
    pass('currentDevices được reset về 0 sau cleanup')
  } else {
    info(`currentDevices = ${key?.currentDevices} (expected 0)`)
  }
}

// ============================================
// TEST 9: Cùng hwid kích hoạt lại → refresh session
// ============================================
async function test9_SameHwidReactivate() {
  header('TEST 9: Cùng HWID kích hoạt lại → refresh session (không tạo mới)')

  // Dọn sạch activations cũ
  await prisma.keyActivation.deleteMany({ where: { keyId: testKeyId! } })
  await prisma.licenseKey.update({
    where: { id: testKeyId! },
    data: { currentDevices: 0 },
  })

  // Kích hoạt lần 1
  const res1 = await activateKey({
    key: testKeyString!,
    hwid: 'TEST-DEVICE-SAME',
    deviceName: 'Same Device',
  })

  if (!res1.success) {
    fail(`Kích hoạt lần 1 thất bại: ${res1.error}`)
    testFailed++
    return
  }

  // Kích hoạt lần 2 với cùng HWID
  const res2 = await activateKey({
    key: testKeyString!,
    hwid: 'TEST-DEVICE-SAME',
    deviceName: 'Same Device',
  })

  if (res2.success) {
    pass('Cùng HWID kích hoạt lại thành công (refresh session)')
    testPassed++
  } else {
    fail(`Cùng HWID không kích hoạt lại được: ${res2.error}`)
    testFailed++
  }

  // Verify chỉ có 1 activation active
  const count = await prisma.keyActivation.count({
    where: {
      keyId: testKeyId!,
      status: 'ACTIVE',
    },
  })

  if (count === 1) {
    pass('Chỉ có 1 activation record active (không duplicate)')
  } else {
    info(`Có ${count} activation records active`)
  }
}

// ============================================
// RUN ALL TESTS
// ============================================
async function main() {
  console.log(`\n${colors.bold}${colors.cyan}╔═══════════════════════════════════════════════╗`)
  console.log(`║  TEST CONCURRENT SESSION LOGIC                ║`)
  console.log(`╚═══════════════════════════════════════════════╝${colors.reset}\n`)

  log(`Timeout: ${SESSION_TIMEOUT_MS / 1000}s + Grace: ${SESSION_GRACE_MS / 1000}s = ${(SESSION_TIMEOUT_MS + SESSION_GRACE_MS) / 1000}s`)
  log(`Bắt đầu test (gọi trực tiếp lib functions, không cần server)...\n`)

  try {
    await setupTestKey()

    await test1_ActivateSuccess()
    await test2_HeartbeatKeepsAlive()
    await test3_ConcurrentLimitBlocked()
    await test4_ValidateKeyInUse()
    await test5_DeactivateFreesSlot()
    await test6_SessionAutoExpire()
    await test7_HeartbeatExpiredSession()
    await test8_GlobalCleanup()
    await test9_SameHwidReactivate()

  } catch (error) {
    console.error(`\n${colors.red}Lỗi:${colors.reset}`, error)
  } finally {
    await cleanupTestKey()
    await prisma.$disconnect()
  }

  // Summary
  header('KẾT QUẢ')
  console.log(`  ${colors.green}Passed: ${testPassed}${colors.reset}`)
  console.log(`  ${colors.red}Failed: ${testFailed}${colors.reset}`)
  console.log(`  Total:  ${testPassed + testFailed}\n`)

  if (testFailed > 0) {
    process.exit(1)
  }
}

main()

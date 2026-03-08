/**
 * License Key Utilities
 * Các hàm tiện ích để tạo và quản lý license key
 * 
 * LOGIC ĐỒNG THỜI (Concurrent Session):
 * - maxDevices = số phiên đồng thời tối đa (không phải số thiết bị)
 * - Khi user kích hoạt key, tạo session với heartbeat
 * - Session hết hạn nếu không heartbeat trong SESSION_TIMEOUT_MS
 * - Phiên hết hạn được tự động dọn dẹp, giải phóng slot cho người khác
 */

import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// ============================================
// SESSION TIMEOUT CONFIGURATION
// ============================================
// Thời gian tối đa không heartbeat trước khi session bị coi là hết hạn
// App client phải gọi heartbeat thường xuyên hơn khoảng này
export const SESSION_TIMEOUT_MS = 5 * 60 * 1000 // 5 phút
// Grace period: thêm 1 phút buffer cho network latency
export const SESSION_GRACE_MS = 1 * 60 * 1000 // 1 phút
// Tổng timeout thực tế = SESSION_TIMEOUT_MS + SESSION_GRACE_MS = 6 phút

// Key format: XXXX-XXXX-XXXX-XXXX (16 ký tự + 3 dấu gạch)
const KEY_SEGMENT_LENGTH = 4
const KEY_SEGMENTS = 4
const KEY_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Bỏ I, O, 0, 1 để tránh nhầm lẫn

/**
 * Tạo một license key mới
 * Format: XXXX-XXXX-XXXX-XXXX
 */
export function generateKeyString(): string {
  const segments: string[] = []

  for (let i = 0; i < KEY_SEGMENTS; i++) {
    let segment = ''
    for (let j = 0; j < KEY_SEGMENT_LENGTH; j++) {
      const randomIndex = crypto.randomInt(0, KEY_CHARS.length)
      segment += KEY_CHARS[randomIndex]
    }
    segments.push(segment)
  }

  return segments.join('-')
}

/**
 * Tạo nhiều license keys
 */
export function generateMultipleKeys(count: number): string[] {
  const keys: string[] = []
  const usedKeys = new Set<string>()

  while (keys.length < count) {
    const key = generateKeyString()
    if (!usedKeys.has(key)) {
      usedKeys.add(key)
      keys.push(key)
    }
  }

  return keys
}

/**
 * Validate format của key
 */
export function isValidKeyFormat(key: string): boolean {
  // Format: XXXX-XXXX-XXXX-XXXX
  const regex = /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/
  return regex.test(key.toUpperCase())
}

/**
 * Chuẩn hóa key (uppercase và trim)
 */
export function normalizeKey(key: string): string {
  return key.trim().toUpperCase().replace(/\s/g, '')
}

/**
 * Tạo order number
 * Format: ORD-YYYYMMDD-XXXXX
 */
export function generateOrderNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = crypto.randomInt(10000, 99999)
  return `ORD-${dateStr}-${random}`
}

/**
 * Tính ngày hết hạn dựa trên duration type
 * Sử dụng UTC để tránh vấn đề timezone
 * 
 * Supported duration types:
 * - HOUR: Giờ (VD: 4 giờ = HOUR + 4)
 * - DAY: Ngày
 * - WEEK: Tuần
 * - MONTH: Tháng
 * - QUARTER: Quý (3 tháng)
 * - YEAR: Năm
 * - LIFETIME: Vĩnh viễn
 */
export function calculateExpirationDate(
  durationType: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR' | 'LIFETIME',
  durationValue: number,
  fromDate: Date = new Date()
): Date | null {
  if (durationType === 'LIFETIME') {
    return null // null = không hết hạn
  }

  // Chuyển đổi sang UTC milliseconds để tính toán chính xác
  // Sử dụng Date.UTC() để đảm bảo timezone nhất quán
  const expirationMs = fromDate.getTime()

  switch (durationType) {
    case 'HOUR':
      // Thêm giờ: 1 ngày = 24 giờ, 4 giờ = 4 giờ
      return new Date(expirationMs + (durationValue * 60 * 60 * 1000))
    case 'DAY':
      // Thêm ngày: Sử dụng UTC day để tránh DST issues
      return new Date(expirationMs + (durationValue * 24 * 60 * 60 * 1000))
    case 'WEEK':
      return new Date(expirationMs + (durationValue * 7 * 24 * 60 * 60 * 1000))
    case 'MONTH':
      // Thêm tháng: Cộng tháng vào date hiện tại
      const monthDate = new Date(fromDate)
      monthDate.setUTCMonth(monthDate.getUTCMonth() + durationValue)
      return monthDate
    case 'QUARTER':
      // Quý = 3 tháng
      const quarterDate = new Date(fromDate)
      quarterDate.setUTCMonth(quarterDate.getUTCMonth() + (durationValue * 3))
      return quarterDate
    case 'YEAR':
      const yearDate = new Date(fromDate)
      yearDate.setUTCFullYear(yearDate.getUTCFullYear() + durationValue)
      return yearDate
    default:
      // Fallback - không thêm gì
      return fromDate
  }
}

/**
 * Kiểm tra key có hết hạn chưa
 */
export function isKeyExpired(expiresAt: Date | null): boolean {
  if (expiresAt === null) return false // Lifetime key
  return new Date() > expiresAt
}

/**
 * Tính số ngày còn lại
 * Sử dụng UTC để tránh vấn đề timezone
 */
export function getDaysRemaining(expiresAt: Date | null): number | null {
  if (expiresAt === null) return null // Lifetime

  // Chuyển đổi sang UTC milliseconds để tính toán chính xác
  const now = Date.now()
  const expiresAtTime = new Date(expiresAt).getTime()
  const diffTime = expiresAtTime - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays > 0 ? diffDays : 0
}

/**
 * Format duration để hiển thị
 */
export function formatDuration(
  durationType: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR' | 'LIFETIME',
  durationValue: number
): string {
  if (durationType === 'LIFETIME') {
    return 'Vĩnh viễn'
  }

  const labels: Record<string, string> = {
    HOUR: 'giờ',
    DAY: 'ngày',
    WEEK: 'tuần',
    MONTH: 'tháng',
    QUARTER: 'quý',
    YEAR: 'năm',
  }

  return `${durationValue} ${labels[durationType]}`
}

/**
 * Hash HWID để lưu trữ an toàn hơn
 */
export function hashHwid(hwid: string): string {
  return crypto
    .createHash('sha256')
    .update(hwid.toLowerCase().trim())
    .digest('hex')
}

/**
 * Tạo license key trong database
 */
export async function createLicenseKey(params: {
  planId: string
  userId?: string
  notes?: string
  createdBy?: string
}) {
  const { planId, userId, notes, createdBy } = params

  // Lấy thông tin plan
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  })

  if (!plan) {
    throw new Error('Plan not found')
  }

  // Tạo key unique
  let key = generateKeyString()
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const existing = await prisma.licenseKey.findUnique({
      where: { key },
    })

    if (!existing) break

    key = generateKeyString()
    attempts++
  }

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique key')
  }

  // Tạo license key
  // Tính ngày hết hạn
  // Use UTC timestamp to avoid timezone issues
  let expiresAt: Date | null = null
  if (plan.durationType !== 'LIFETIME') {
    expiresAt = calculateExpirationDate(plan.durationType, plan.durationValue, new Date(Date.now()))
  }

  const licenseKey = await prisma.licenseKey.create({
    data: {
      key,
      planId,
      userId,
      maxDevices: plan.maxDevices,
      notes,
      createdBy,
      status: 'INACTIVE',
      expiresAt,
    },
    include: {
      plan: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  return licenseKey
}

/**
 * Tạo nhiều license keys
 */
export async function createMultipleLicenseKeys(params: {
  planId: string
  count: number
  notes?: string
  createdBy?: string
}) {
  const { planId, count, notes, createdBy } = params

  const keys = []

  for (let i = 0; i < count; i++) {
    const key = await createLicenseKey({
      planId,
      notes,
      createdBy,
    })
    keys.push(key)
  }

  return keys
}

/**
 * Dọn dẹp các phiên hết hạn (stale sessions)
 * Phiên bị coi là hết hạn nếu lastSeenAt > SESSION_TIMEOUT_MS + SESSION_GRACE_MS
 * 
 * Giải quyết bug tiềm năng:
 * - User tắt app mà không logout → session treo → chặn người khác
 * - App crash → không gửi deactivate → timeout tự xử lý
 * - Mất mạng kéo dài → session tự hết hạn
 */
export async function cleanupStaleSessions(keyId: string): Promise<number> {
  const timeoutThreshold = new Date(Date.now() - SESSION_TIMEOUT_MS - SESSION_GRACE_MS)

  const result = await prisma.keyActivation.updateMany({
    where: {
      keyId,
      status: 'ACTIVE',
      lastSeenAt: {
        lt: timeoutThreshold,
      },
    },
    data: {
      status: 'DEACTIVATED',
      deactivatedAt: new Date(),
    },
  })

  // Cập nhật currentDevices (số phiên đang hoạt động) nếu có session bị dọn
  if (result.count > 0) {
    const activeCount = await prisma.keyActivation.count({
      where: { keyId, status: 'ACTIVE' },
    })

    await prisma.licenseKey.update({
      where: { id: keyId },
      data: { currentDevices: activeCount },
    })

    // Log cleanup
    try {
      await prisma.keyUsageLog.create({
        data: {
          keyId,
          action: 'DEACTIVATE',
          details: JSON.stringify({
            reason: 'session_timeout',
            cleanedSessions: result.count,
            timeoutMs: SESSION_TIMEOUT_MS + SESSION_GRACE_MS,
          }),
          success: true,
        },
      })
    } catch (e) {
      console.error('Failed to log session cleanup:', e)
    }
  }

  return result.count
}

/**
 * Kích hoạt key với HWID - Logic phiên đồng thời
 * 
 * Flow:
 * 1. Dọn dẹp phiên hết hạn (stale sessions)
 * 2. Nếu HWID đã có phiên active → refresh heartbeat (cùng máy mở lại)
 * 3. Kiểm tra số phiên đồng thời hiện tại
 * 4. Nếu đạt giới hạn → từ chối (KEY_IN_USE)
 * 5. Nếu còn slot → tạo phiên mới
 * 
 * Race condition protection: Sử dụng transaction với count check bên trong
 */
export async function activateKey(params: {
  key: string
  hwid: string
  deviceName?: string
  deviceInfo?: string
  ipAddress?: string
  userAgent?: string
}) {
  const { key, hwid, deviceName, deviceInfo, ipAddress, userAgent } = params

  const normalizedKey = normalizeKey(key)
  const hashedHwid = hashHwid(hwid)

  // Tìm key
  const licenseKey = await prisma.licenseKey.findUnique({
    where: { key: normalizedKey },
    include: {
      plan: true,
      activations: {
        where: { status: 'ACTIVE' },
      },
    },
  })

  if (!licenseKey) {
    return { success: false, error: 'INVALID_KEY', message: 'Key không hợp lệ' }
  }

  // Kiểm tra status
  if (licenseKey.status === 'REVOKED') {
    return { success: false, error: 'KEY_REVOKED', message: 'Key đã bị thu hồi' }
  }

  if (licenseKey.status === 'BANNED') {
    return { success: false, error: 'KEY_BANNED', message: 'Key đã bị cấm' }
  }

  if (licenseKey.status === 'SUSPENDED') {
    return { success: false, error: 'KEY_SUSPENDED', message: 'Key đang bị tạm khóa' }
  }

  // Kiểm tra hết hạn
  if (licenseKey.status === 'EXPIRED' || (licenseKey.expiresAt && isKeyExpired(licenseKey.expiresAt))) {
    // Update status nếu chưa đánh dấu expired
    if (licenseKey.status !== 'EXPIRED') {
      await prisma.licenseKey.update({
        where: { id: licenseKey.id },
        data: { status: 'EXPIRED' },
      })
    }
    return { success: false, error: 'KEY_EXPIRED', message: 'Key đã hết hạn' }
  }

  // === BƯỚC 1: Dọn dẹp phiên hết hạn ===
  // Giải quyết: stale sessions từ app crash, tắt app, mất mạng
  await cleanupStaleSessions(licenseKey.id)

  // === BƯỚC 2: Kiểm tra HWID đã có phiên active chưa ===
  // Reload activations sau cleanup
  const currentActivations = await prisma.keyActivation.findMany({
    where: { keyId: licenseKey.id, status: 'ACTIVE' },
  })

  const existingActivation = currentActivations.find(
    a => a.hwid === hashedHwid
  )

  if (existingActivation) {
    // Cùng máy đăng nhập lại → refresh heartbeat, không tốn slot
    await prisma.keyActivation.update({
      where: { id: existingActivation.id },
      data: { lastSeenAt: new Date() },
    })

    await prisma.licenseKey.update({
      where: { id: licenseKey.id },
      data: {
        lastUsedAt: new Date(),
        lastUsedIp: ipAddress,
        lastHwid: hashedHwid,
      },
    })

    // Log usage
    await logKeyUsage({
      keyId: licenseKey.id,
      action: 'LOGIN',
      hwid: hashedHwid,
      ipAddress,
      userAgent,
      success: true,
    })

    return {
      success: true,
      message: 'Đã đăng nhập',
      data: {
        keyId: licenseKey.id,
        plan: licenseKey.plan.name,
        expiresAt: licenseKey.expiresAt,
        daysRemaining: getDaysRemaining(licenseKey.expiresAt),
        sessionTimeout: SESSION_TIMEOUT_MS,
      },
    }
  }

  // === BƯỚC 3: Kiểm tra số phiên đồng thời ===
  // Race condition protection: kiểm tra trong transaction
  const activeSessions = currentActivations.length
  if (activeSessions >= licenseKey.maxDevices) {
    await logKeyUsage({
      keyId: licenseKey.id,
      action: 'ACTIVATE',
      hwid: hashedHwid,
      ipAddress,
      userAgent,
      success: false,
      errorMessage: 'Key đang được sử dụng bởi người khác',
    })

    return {
      success: false,
      error: 'KEY_IN_USE',
      message: licenseKey.maxDevices === 1
        ? 'Key đang được sử dụng bởi người khác. Vui lòng thử lại sau.'
        : `Key đã đạt giới hạn ${licenseKey.maxDevices} phiên đồng thời. Vui lòng thử lại sau.`,
      currentSessions: activeSessions,
      maxConcurrent: licenseKey.maxDevices,
    }
  }

  // === BƯỚC 4: Tạo phiên mới ===
  // Nếu key chưa được kích hoạt lần nào, set activation date và expiration
  let expiresAt = licenseKey.expiresAt
  let activatedAt = licenseKey.activatedAt

  if (licenseKey.status === 'INACTIVE') {
    activatedAt = new Date(Date.now())
    expiresAt = calculateExpirationDate(
      licenseKey.plan.durationType,
      licenseKey.plan.durationValue,
      activatedAt
    )
  }

  // Transaction để tránh race condition
  // Nếu 2 request đồng thời vượt qua check ở trên,
  // transaction sẽ đảm bảo count chính xác
  await prisma.$transaction(async (tx) => {
    // Double-check trong transaction để chống race condition
    const activeCountInTx = await tx.keyActivation.count({
      where: { keyId: licenseKey.id, status: 'ACTIVE' },
    })

    if (activeCountInTx >= licenseKey.maxDevices) {
      throw new Error('CONCURRENT_LIMIT_EXCEEDED')
    }

    // Tạo activation mới hoặc kích hoạt lại phiên cũ
    await tx.keyActivation.upsert({
      where: {
        keyId_hwid: {
          keyId: licenseKey.id,
          hwid: hashedHwid,
        },
      },
      update: {
        deviceName,
        deviceInfo,
        ipAddress,
        userAgent,
        status: 'ACTIVE',
        deactivatedAt: null,
        lastSeenAt: new Date(),
      },
      create: {
        keyId: licenseKey.id,
        hwid: hashedHwid,
        deviceName,
        deviceInfo,
        ipAddress,
        userAgent,
        status: 'ACTIVE',
      },
    })

    // Update license key
    await tx.licenseKey.update({
      where: { id: licenseKey.id },
      data: {
        status: 'ACTIVE',
        activatedAt,
        expiresAt,
        currentDevices: activeCountInTx + 1,
        totalActivations: { increment: 1 },
        lastUsedAt: new Date(),
        lastUsedIp: ipAddress,
        lastHwid: hashedHwid,
      },
    })

    // Log
    await tx.keyUsageLog.create({
      data: {
        keyId: licenseKey.id,
        action: 'ACTIVATE',
        hwid: hashedHwid,
        ipAddress,
        userAgent,
        success: true,
      },
    })
  }).catch((err) => {
    if (err.message === 'CONCURRENT_LIMIT_EXCEEDED') {
      // Race condition caught - trả về lỗi
      return null // sẽ check bên dưới
    }
    throw err
  })

  // Nếu race condition xảy ra trong transaction
  // (2 requests cùng vượt qua check nhưng transaction thứ 2 thấy đã đủ)
  const finalActiveCount = await prisma.keyActivation.count({
    where: { keyId: licenseKey.id, status: 'ACTIVE' },
  })

  // Kiểm tra xem HWID của mình có được kích hoạt thành công không
  const myActivation = await prisma.keyActivation.findUnique({
    where: { keyId_hwid: { keyId: licenseKey.id, hwid: hashedHwid } },
  })

  if (!myActivation || myActivation.status !== 'ACTIVE') {
    return {
      success: false,
      error: 'KEY_IN_USE',
      message: 'Key đang được sử dụng bởi người khác. Vui lòng thử lại sau.',
      currentSessions: finalActiveCount,
      maxConcurrent: licenseKey.maxDevices,
    }
  }

  return {
    success: true,
    message: 'Kích hoạt thành công',
    data: {
      keyId: licenseKey.id,
      plan: licenseKey.plan.name,
      expiresAt,
      daysRemaining: getDaysRemaining(expiresAt),
      currentSessions: finalActiveCount,
      maxConcurrent: licenseKey.maxDevices,
      sessionTimeout: SESSION_TIMEOUT_MS,
    },
  }
}

/**
 * Validate key (không kích hoạt, chỉ kiểm tra)
 * Cũng dọn dẹp stale sessions để trả về thông tin chính xác
 */
export async function validateKey(params: {
  key: string
  hwid?: string
  ipAddress?: string
  userAgent?: string
}) {
  const { key, hwid, ipAddress, userAgent } = params

  const normalizedKey = normalizeKey(key)
  const hashedHwid = hwid ? hashHwid(hwid) : null

  // Tìm key
  const licenseKey = await prisma.licenseKey.findUnique({
    where: { key: normalizedKey },
    include: {
      plan: true,
      activations: {
        where: { status: 'ACTIVE' },
      },
    },
  })

  if (!licenseKey) {
    return { valid: false, error: 'INVALID_KEY', message: 'Key không hợp lệ' }
  }

  // Dọn dẹp stale sessions trước
  await cleanupStaleSessions(licenseKey.id)

  // Reload activations sau cleanup
  const activeActivations = await prisma.keyActivation.findMany({
    where: { keyId: licenseKey.id, status: 'ACTIVE' },
  })

  // Log validate attempt
  await logKeyUsage({
    keyId: licenseKey.id,
    action: 'VALIDATE',
    hwid: hashedHwid || undefined,
    ipAddress,
    userAgent,
    success: true,
  })

  // Kiểm tra status
  const statusErrors: Record<string, string> = {
    REVOKED: 'Key đã bị thu hồi',
    BANNED: 'Key đã bị cấm',
    SUSPENDED: 'Key đang bị tạm khóa',
  }

  if (statusErrors[licenseKey.status]) {
    return {
      valid: false,
      error: `KEY_${licenseKey.status}`,
      message: statusErrors[licenseKey.status],
    }
  }

  // Kiểm tra hết hạn
  if (licenseKey.expiresAt && isKeyExpired(licenseKey.expiresAt)) {
    if (licenseKey.status !== 'EXPIRED') {
      await prisma.licenseKey.update({
        where: { id: licenseKey.id },
        data: { status: 'EXPIRED' },
      })
    }
    return { valid: false, error: 'KEY_EXPIRED', message: 'Key đã hết hạn' }
  }

  // Nếu có HWID, kiểm tra phiên đồng thời
  if (hashedHwid) {
    const isSessionActive = activeActivations.some(a => a.hwid === hashedHwid)
    if (!isSessionActive && licenseKey.status === 'ACTIVE') {
      // HWID này chưa có phiên active, kiểm tra có slot không
      if (activeActivations.length >= licenseKey.maxDevices) {
        return {
          valid: false,
          error: 'KEY_IN_USE',
          message: 'Key đang được sử dụng bởi người khác',
        }
      }
    }
  }

  return {
    valid: true,
    data: {
      keyId: licenseKey.id,
      status: licenseKey.status,
      plan: {
        id: licenseKey.plan.id,
        name: licenseKey.plan.name,
        durationType: licenseKey.plan.durationType,
        durationValue: licenseKey.plan.durationValue,
      },
      activatedAt: licenseKey.activatedAt,
      expiresAt: licenseKey.expiresAt,
      daysRemaining: getDaysRemaining(licenseKey.expiresAt),
      currentSessions: activeActivations.length,
      maxConcurrent: licenseKey.maxDevices,
      isSessionActive: hashedHwid
        ? activeActivations.some(a => a.hwid === hashedHwid)
        : undefined,
      sessionTimeout: SESSION_TIMEOUT_MS,
    },
  }
}

/**
 * Hủy kích hoạt phiên (logout / disconnect)
 * Giải phóng slot cho người khác sử dụng
 */
export async function deactivateDevice(params: {
  key: string
  hwid: string
  ipAddress?: string
  userAgent?: string
}) {
  const { key, hwid, ipAddress, userAgent } = params

  const normalizedKey = normalizeKey(key)
  const hashedHwid = hashHwid(hwid)

  const licenseKey = await prisma.licenseKey.findUnique({
    where: { key: normalizedKey },
    include: {
      activations: {
        where: { hwid: hashedHwid, status: 'ACTIVE' },
      },
    },
  })

  if (!licenseKey) {
    return { success: false, error: 'INVALID_KEY', message: 'Key không hợp lệ' }
  }

  const activation = licenseKey.activations[0]
  if (!activation) {
    return { success: false, error: 'NOT_ACTIVATED', message: 'Thiết bị này chưa được kích hoạt' }
  }

  await prisma.$transaction(async (tx) => {
    // Update activation
    await tx.keyActivation.update({
      where: { id: activation.id },
      data: {
        status: 'DEACTIVATED',
        deactivatedAt: new Date(),
      },
    })

    // Update key
    await tx.licenseKey.update({
      where: { id: licenseKey.id },
      data: {
        currentDevices: { decrement: 1 },
      },
    })

    // Log
    await tx.keyUsageLog.create({
      data: {
        keyId: licenseKey.id,
        action: 'DEACTIVATE',
        hwid: hashedHwid,
        ipAddress,
        userAgent,
        success: true,
      },
    })
  })

  return { success: true, message: 'Đã hủy kích hoạt thiết bị' }
}

/**
 * Log key usage
 */
async function logKeyUsage(params: {
  keyId: string
  action: 'VALIDATE' | 'ACTIVATE' | 'DEACTIVATE' | 'HEARTBEAT' | 'LOGIN' | 'RESET_HWID' | 'EXTEND' | 'SUSPEND' | 'REVOKE'
  hwid?: string
  ipAddress?: string
  userAgent?: string
  details?: string
  success: boolean
  errorMessage?: string
}) {
  try {
    await prisma.keyUsageLog.create({
      data: {
        keyId: params.keyId,
        action: params.action,
        hwid: params.hwid,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        details: params.details,
        success: params.success,
        errorMessage: params.errorMessage,
      },
    })
  } catch (error) {
    console.error('Failed to log key usage:', error)
  }
}

/**
 * Heartbeat - App gọi định kỳ để giữ phiên hoạt động
 * 
 * CRITICAL: Client PHẢI gọi heartbeat mỗi (SESSION_TIMEOUT_MS / 2) ms
 * Nếu không heartbeat trong SESSION_TIMEOUT_MS + SESSION_GRACE_MS,
 * phiên sẽ bị coi là hết hạn và bị dọn dẹp → giải phóng slot
 * 
 * Returns:
 * - valid: true → phiên vẫn hoạt động
 * - valid: false, error: 'SESSION_EXPIRED' → phiên đã hết hạn, cần kích hoạt lại
 */
export async function heartbeat(params: {
  key: string
  hwid: string
  ipAddress?: string
}) {
  const { key, hwid, ipAddress } = params

  const normalizedKey = normalizeKey(key)
  const hashedHwid = hashHwid(hwid)

  const licenseKey = await prisma.licenseKey.findUnique({
    where: { key: normalizedKey },
    include: {
      plan: true,
      activations: {
        where: { hwid: hashedHwid, status: 'ACTIVE' },
      },
    },
  })

  if (!licenseKey) {
    return { valid: false, error: 'INVALID_KEY' }
  }

  // Kiểm tra hết hạn key
  if (licenseKey.expiresAt && isKeyExpired(licenseKey.expiresAt)) {
    return { valid: false, error: 'KEY_EXPIRED' }
  }

  if (!['ACTIVE', 'INACTIVE'].includes(licenseKey.status)) {
    return { valid: false, error: `KEY_${licenseKey.status}` }
  }

  const activation = licenseKey.activations[0]
  if (!activation) {
    // Phiên không tồn tại hoặc đã bị deactivate (có thể do timeout)
    return { valid: false, error: 'SESSION_EXPIRED', message: 'Phiên đã hết hạn. Vui lòng kích hoạt lại.' }
  }

  // Kiểm tra xem phiên có bị timeout chưa
  const timeSinceLastSeen = Date.now() - new Date(activation.lastSeenAt).getTime()
  if (timeSinceLastSeen > SESSION_TIMEOUT_MS + SESSION_GRACE_MS) {
    // Phiên đã quá timeout → deactivate
    await prisma.keyActivation.update({
      where: { id: activation.id },
      data: { status: 'DEACTIVATED', deactivatedAt: new Date() },
    })
    
    // Update counter
    const activeCount = await prisma.keyActivation.count({
      where: { keyId: licenseKey.id, status: 'ACTIVE' },
    })
    await prisma.licenseKey.update({
      where: { id: licenseKey.id },
      data: { currentDevices: activeCount },
    })

    return { valid: false, error: 'SESSION_EXPIRED', message: 'Phiên đã hết hạn do không có heartbeat. Vui lòng kích hoạt lại.' }
  }

  // Dọn dẹp stale sessions của key này (phiên khác hết hạn)
  await cleanupStaleSessions(licenseKey.id)

  // Update last seen - giữ phiên sống
  await prisma.$transaction([
    prisma.keyActivation.update({
      where: { id: activation.id },
      data: { lastSeenAt: new Date() },
    }),
    prisma.licenseKey.update({
      where: { id: licenseKey.id },
      data: {
        lastUsedAt: new Date(),
        lastUsedIp: ipAddress,
      },
    }),
    prisma.keyUsageLog.create({
      data: {
        keyId: licenseKey.id,
        action: 'HEARTBEAT',
        hwid: hashedHwid,
        ipAddress,
        success: true,
      },
    }),
  ])

  return {
    valid: true,
    data: {
      expiresAt: licenseKey.expiresAt,
      daysRemaining: getDaysRemaining(licenseKey.expiresAt),
      plan: licenseKey.plan.name,
      sessionTimeout: SESSION_TIMEOUT_MS,
      nextHeartbeatIn: Math.floor(SESSION_TIMEOUT_MS / 2), // Client nên heartbeat trước nửa timeout
    },
  }
}

/**
 * License Key Utilities
 * Các hàm tiện ích để tạo và quản lý license key
 */

import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

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
 */
export function calculateExpirationDate(
  durationType: 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR' | 'LIFETIME',
  durationValue: number,
  fromDate: Date = new Date()
): Date | null {
  if (durationType === 'LIFETIME') {
    return null // null = không hết hạn
  }

  // Chuyển đổi sang UTC để đảm bảo tính nhất quán
  const expirationDate = new Date(Date.UTC(
    fromDate.getFullYear(),
    fromDate.getMonth(),
    fromDate.getDate(),
    fromDate.getHours(),
    fromDate.getMinutes(),
    fromDate.getSeconds(),
    fromDate.getMilliseconds()
  ))

  switch (durationType) {
    case 'DAY':
      expirationDate.setUTCDate(expirationDate.getUTCDate() + durationValue)
      break
    case 'WEEK':
      expirationDate.setUTCDate(expirationDate.getUTCDate() + (durationValue * 7))
      break
    case 'MONTH':
      expirationDate.setUTCMonth(expirationDate.getUTCMonth() + durationValue)
      break
    case 'QUARTER':
      expirationDate.setUTCMonth(expirationDate.getUTCMonth() + (durationValue * 3))
      break
    case 'YEAR':
      expirationDate.setUTCFullYear(expirationDate.getUTCFullYear() + durationValue)
      break
  }

  return expirationDate
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
  durationType: 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR' | 'LIFETIME',
  durationValue: number
): string {
  if (durationType === 'LIFETIME') {
    return 'Vĩnh viễn'
  }

  const labels: Record<string, string> = {
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
  let expiresAt: Date | null = null
  if (plan.durationType !== 'LIFETIME') {
    expiresAt = calculateExpirationDate(plan.durationType, plan.durationValue)
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
 * Kích hoạt key với HWID
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

  // Kiểm tra xem HWID đã được kích hoạt chưa
  const existingActivation = licenseKey.activations.find(
    a => a.hwid === hashedHwid && a.status === 'ACTIVE'
  )

  if (existingActivation) {
    // Update last seen
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
      },
    }
  }

  // Kiểm tra số thiết bị
  const activeDevices = licenseKey.activations.length
  if (activeDevices >= licenseKey.maxDevices) {
    await logKeyUsage({
      keyId: licenseKey.id,
      action: 'ACTIVATE',
      hwid: hashedHwid,
      ipAddress,
      userAgent,
      success: false,
      errorMessage: 'Đã đạt giới hạn thiết bị',
    })

    return {
      success: false,
      error: 'MAX_DEVICES_REACHED',
      message: `Key này chỉ cho phép ${licenseKey.maxDevices} thiết bị. Vui lòng hủy kích hoạt thiết bị khác trước.`,
      currentDevices: activeDevices,
      maxDevices: licenseKey.maxDevices,
    }
  }

  // Nếu key chưa được kích hoạt lần nào, set activation date và expiration
  let expiresAt = licenseKey.expiresAt
  let activatedAt = licenseKey.activatedAt

  if (licenseKey.status === 'INACTIVE') {
    activatedAt = new Date()
    expiresAt = calculateExpirationDate(
      licenseKey.plan.durationType,
      licenseKey.plan.durationValue,
      activatedAt
    )
  }

  // Tạo activation mới
  await prisma.$transaction(async (tx) => {
    // Tạo activation mới hoặc kích hoạt lại thiết bị cũ
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
        currentDevices: activeDevices + 1,
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
  })

  return {
    success: true,
    message: 'Kích hoạt thành công',
    data: {
      keyId: licenseKey.id,
      plan: licenseKey.plan.name,
      expiresAt,
      daysRemaining: getDaysRemaining(expiresAt),
      currentDevices: activeDevices + 1,
      maxDevices: licenseKey.maxDevices,
    },
  }
}

/**
 * Validate key (không kích hoạt, chỉ kiểm tra)
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

  // Nếu có HWID, kiểm tra xem có được phép không
  if (hashedHwid) {
    const isActivated = licenseKey.activations.some(a => a.hwid === hashedHwid)
    if (!isActivated && licenseKey.status === 'ACTIVE') {
      // Key đang active nhưng HWID này chưa được kích hoạt
      // Kiểm tra có còn slot không
      if (licenseKey.activations.length >= licenseKey.maxDevices) {
        return {
          valid: false,
          error: 'HWID_NOT_ACTIVATED',
          message: 'Thiết bị này chưa được kích hoạt và key đã đạt giới hạn thiết bị',
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
      currentDevices: licenseKey.activations.length,
      maxDevices: licenseKey.maxDevices,
      isHwidActivated: hashedHwid
        ? licenseKey.activations.some(a => a.hwid === hashedHwid)
        : undefined,
    },
  }
}

/**
 * Hủy kích hoạt thiết bị
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
 * Heartbeat - App gọi định kỳ để xác nhận vẫn đang sử dụng
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

  // Kiểm tra hết hạn
  if (licenseKey.expiresAt && isKeyExpired(licenseKey.expiresAt)) {
    return { valid: false, error: 'KEY_EXPIRED' }
  }

  if (!['ACTIVE', 'INACTIVE'].includes(licenseKey.status)) {
    return { valid: false, error: `KEY_${licenseKey.status}` }
  }

  const activation = licenseKey.activations[0]
  if (!activation) {
    return { valid: false, error: 'HWID_NOT_ACTIVATED' }
  }

  // Update last seen
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
    },
  }
}

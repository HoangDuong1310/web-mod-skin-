/**
 * Script chạy bằng crontab trên server để dọn dẹp stale sessions
 * 
 * Cách cài đặt crontab (chạy mỗi 5 phút):
 *   crontab -e
 *   Thêm dòng:
 *   *​/5 * * * * cd /var/www/html/web-mod-skin && /usr/bin/npx tsx scripts/cleanup-sessions.ts >> /var/log/pm2/session-cleanup.log 2>&1
 * 
 * Hoặc gọi qua curl (nếu server đang chạy):
 *   *​/5 * * * * curl -s http://localhost:3001/api/cron/cleanup-sessions >> /var/log/pm2/session-cleanup.log 2>&1
 */

import { PrismaClient } from '@prisma/client'

const SESSION_TIMEOUT_MS = 5 * 60 * 1000 // 5 phút
const SESSION_GRACE_MS = 1 * 60 * 1000   // 1 phút

async function cleanupAllStaleSessions() {
  const prisma = new PrismaClient()

  try {
    const timeoutThreshold = new Date(Date.now() - SESSION_TIMEOUT_MS - SESSION_GRACE_MS)

    // Tìm tất cả session hết hạn
    const staleSessions = await prisma.keyActivation.findMany({
      where: {
        status: 'ACTIVE',
        lastSeenAt: {
          lt: timeoutThreshold,
        },
      },
      select: {
        keyId: true,
      },
    })

    if (staleSessions.length === 0) {
      console.log(`[${new Date().toISOString()}] No stale sessions found`)
      return
    }

    const affectedKeyIds = [...new Set(staleSessions.map(s => s.keyId))]

    // Deactivate tất cả stale sessions
    const result = await prisma.keyActivation.updateMany({
      where: {
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

    // Cập nhật currentDevices cho từng key
    for (const keyId of affectedKeyIds) {
      const activeCount = await prisma.keyActivation.count({
        where: { keyId, status: 'ACTIVE' },
      })

      await prisma.licenseKey.update({
        where: { id: keyId },
        data: { currentDevices: activeCount },
      })
    }

    console.log(
      `[${new Date().toISOString()}] Cleaned ${result.count} stale sessions from ${affectedKeyIds.length} keys`
    )
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Cleanup error:`, error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupAllStaleSessions()

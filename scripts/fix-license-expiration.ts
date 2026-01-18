import { PrismaClient } from '@prisma/client'
import { calculateExpirationDate } from '@/lib/license-key'

const prisma = new PrismaClient()

async function fixLicenseKeyExpiration() {
  // Lấy tất cả license key không phải LIFETIME nhưng expiresAt đang là null
  const licenses = await prisma.licenseKey.findMany({
    where: {
      expiresAt: null,
      plan: {
        durationType: { not: 'LIFETIME' },
      },
    },
    include: {
      plan: true,
    },
  })

  let count = 0
  for (const license of licenses) {
    const { durationType, durationValue } = license.plan
    const expiresAt = calculateExpirationDate(durationType, durationValue, new Date(license.createdAt))
    await prisma.licenseKey.update({
      where: { id: license.id },
      data: { expiresAt },
    })
    count++
  }

  console.log(`Đã cập nhật ${count} license key.`)
}

fixLicenseKeyExpiration().then(() => {
  prisma.$disconnect()
})

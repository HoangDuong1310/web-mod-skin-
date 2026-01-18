import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkOrderAndKey() {
  // Lấy 10 order mới nhất có licenseKey
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      plan: true,
      licenseKey: true,
    },
  })
  for (const order of orders) {
    console.log('Order:', order.id, order.plan?.name, order.plan?.durationType, order.licenseKey?.key, order.licenseKey?.expiresAt)
  }
}

checkOrderAndKey().then(() => prisma.$disconnect())

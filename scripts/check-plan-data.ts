import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkPlanData() {
  const plans = await prisma.subscriptionPlan.findMany({
    select: { id: true, name: true, slug: true, durationType: true, durationValue: true }
  })
  console.table(plans)
}

checkPlanData().then(() => prisma.$disconnect())

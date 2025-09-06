#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding donation goals...');

  // Find first admin user
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!adminUser) {
    console.error('❌ No admin user found. Please create an admin user first.');
    return;
  }

  // Create sample donation goals
  const goals = await Promise.all([
    prisma.donationGoal.create({
      data: {
        title: 'Server Hosting cho năm 2024',
        description: 'Gây quỹ duy trì server và hosting cho website trong năm 2024. Chi phí bao gồm VPS, domain, CDN và các dịch vụ bảo trì.',
        targetAmount: 5000000, // 5 triệu VND
        currency: 'VND',
        isActive: true,
        isVisible: true,
        priority: 1,
        endDate: new Date('2024-12-31'),
        showProgress: true,
        showAmount: true,
        showDonors: true,
        createdBy: adminUser.id
      }
    }),
    
    prisma.donationGoal.create({
      data: {
        title: 'Nâng cấp tính năng mới',
        description: 'Phát triển các tính năng mới như AI review, tự động hóa, và cải thiện trải nghiệm người dùng.',
        targetAmount: 2000000, // 2 triệu VND
        currency: 'VND',
        isActive: true,
        isVisible: true,
        priority: 2,
        endDate: new Date('2024-06-30'),
        showProgress: true,
        showAmount: true,
        showDonors: true,
        createdBy: adminUser.id
      }
    }),

    prisma.donationGoal.create({
      data: {
        title: 'Backup & Bảo mật',
        description: 'Đầu tư vào hệ thống backup tự động, SSL certificates, và các giải pháp bảo mật nâng cao.',
        targetAmount: 1500000, // 1.5 triệu VND
        currency: 'VND',
        isActive: true,
        isVisible: true,
        priority: 3,
        showProgress: true,
        showAmount: false, // Không hiển thị số tiền cụ thể
        showDonors: true,
        createdBy: adminUser.id
      }
    })
  ]);

  console.log('✅ Created donation goals:', goals.map(g => g.title));

  // Create some sample donations
  const donations = await Promise.all([
    prisma.donation.create({
      data: {
        amount: 500000,
        currency: 'VND',
        donorName: 'Nguyễn Văn A',
        donorEmail: 'nguyenvana@email.com',
        isAnonymous: false,
        status: 'COMPLETED',
        message: 'Cảm ơn admin đã tạo ra website hữu ích!',
        isMessagePublic: true,
        goalId: goals[0].id,
        completedAt: new Date()
      }
    }),

    prisma.donation.create({
      data: {
        amount: 200000,
        currency: 'VND',
        isAnonymous: true,
        status: 'COMPLETED',
        message: 'Ủng hộ website phát triển lâu dài',
        isMessagePublic: true,
        goalId: goals[0].id,
        completedAt: new Date()
      }
    }),

    prisma.donation.create({
      data: {
        amount: 300000,
        currency: 'VND',
        donorName: 'Trần Thị B',
        isAnonymous: false,
        status: 'COMPLETED',
        message: '',
        isMessagePublic: false,
        goalId: goals[1].id,
        completedAt: new Date()
      }
    })
  ]);

  // Update goal current amounts
  await prisma.donationGoal.update({
    where: { id: goals[0].id },
    data: { currentAmount: 700000 } // 500k + 200k
  });

  await prisma.donationGoal.update({
    where: { id: goals[1].id },
    data: { currentAmount: 300000 } // 300k
  });

  console.log('✅ Created sample donations:', donations.length);
  console.log('🎉 Donation system seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding donations:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
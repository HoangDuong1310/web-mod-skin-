import { PrismaClient, Role } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    console.log('🔐 Creating admin account...')

    // Tạo tài khoản admin
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@webmodskin.com' },
      update: {
        role: Role.ADMIN,
        password: await hash('Admin@2025!', 12),
      },
      create: {
        email: 'admin@webmodskin.com',
        name: 'Administrator',
        role: Role.ADMIN,
        emailVerified: new Date(),
        password: await hash('Admin@2025!', 12),
      },
    })

    console.log('✅ Admin account created successfully!')
    console.log(`📧 Email: admin@webmodskin.com`)
    console.log(`🔑 Password: Admin@2025!`)
    console.log(`👤 User ID: ${adminUser.id}`)
    
    // Tạo thêm admin backup nếu cần
    const backupAdmin = await prisma.user.upsert({
      where: { email: 'backup@webmodskin.com' },
      update: {
        role: Role.ADMIN,
      },
      create: {
        email: 'backup@webmodskin.com',
        name: 'Backup Admin',
        role: Role.ADMIN,
        emailVerified: new Date(),
        password: await hash('Backup@2025!', 12),
      },
    })

    console.log('✅ Backup admin account created!')
    console.log(`📧 Backup Email: backup@webmodskin.com`)
    console.log(`🔑 Backup Password: Backup@2025!`)

  } catch (error) {
    console.error('❌ Error creating admin:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Chạy script
createAdmin()
  .then(() => {
    console.log('🎉 Admin creation completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Failed to create admin:', error)
    process.exit(1)
  })

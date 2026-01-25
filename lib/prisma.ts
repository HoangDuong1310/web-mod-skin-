import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ??
  new PrismaClient({
    // Connection pool configuration for production
    // These settings help prevent connection pool exhaustion
    datasources: {
      db: {
        // Override connection pool settings from DATABASE_URL
        // connection_limit and pool_timeout can be set in DATABASE_URL
        // e.g., mysql://user:pass@host:3306/db?connection_limit=10&pool_timeout=20
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error', 'warn'],
  })

// Graceful shutdown to release connections
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Handle process termination to close connections properly
if (typeof process !== 'undefined') {
  const shutdown = async () => {
    await prisma.$disconnect()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}



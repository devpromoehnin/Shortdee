import { PrismaClient } from '@prisma/client'

/**
 * Singleton Prisma client.
 *
 * Reuses a single instance across hot-reloads in dev to avoid exhausting
 * the connection pool. Run `pnpm db:generate` before first use.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Re-export generated types + enums so consumers import from one place.
export * from '@prisma/client'

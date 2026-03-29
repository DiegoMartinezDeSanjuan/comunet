import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const isProd = process.env.NODE_ENV === 'production'

  return new PrismaClient({
    // Limit Prisma's own connection pool to avoid saturating PgBouncer
    datasourceUrl: isProd
      ? undefined // Use DATABASE_URL as-is in production (should include pool params)
      : undefined,
    log: isProd
        ? [
            { level: 'error', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
          ]
        : [
            { level: 'query', emit: 'stdout' },
            { level: 'error', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
          ],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

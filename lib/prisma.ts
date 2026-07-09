import { PrismaClient } from './generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function getPrisma(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  })
}

export const prisma = globalForPrisma.prisma ?? getPrisma()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

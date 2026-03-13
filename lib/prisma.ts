import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: ['query'],
    }) // Refresh: 2026-03-13T15:30:00Z

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
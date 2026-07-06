// Force reload of Prisma Client (New Path)
import { PrismaClient } from "@/generated/prisma_new/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as { prisma_v2: PrismaClient }

/**
 * Lazy Prisma singleton.
 * When DATABASE_URL is not set (first-run before setup wizard), returns a Proxy
 * that throws a helpful error on any property access instead of crashing at import.
 */
export const prisma: PrismaClient = (() => {
  if (globalForPrisma.prisma_v2) return globalForPrisma.prisma_v2

  if (!process.env.DATABASE_URL) {
    return new Proxy({} as PrismaClient, {
      get(_, prop) {
        // Avoid breaking Promise resolution and internal checks
        if (prop === "then" || prop === Symbol.toPrimitive || prop === Symbol.toStringTag) {
          return undefined
        }
        throw new Error(
          `[WISEVEO] Database not configured. Complete the setup wizard at /setup first.`
        )
      },
    })
  }

  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  })

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma_v2 = client
  return client
})()


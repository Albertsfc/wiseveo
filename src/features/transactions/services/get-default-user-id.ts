import { prisma } from "@/lib/prisma"

export async function getDefaultUserId(): Promise<string | null> {
  try {
    const user = await prisma.user.findFirst({
      select: { id: true },
      orderBy: { createdAt: "asc" },
    })
    if (user?.id) {
      return user.id
    }
  } catch {
    // Fallback to legacy schema when Prisma models do not match DB tables
  }

  try {
    const legacyUsers = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM public.users
      ORDER BY created_at ASC
      LIMIT 1
    `
    return legacyUsers[0]?.id ?? null
  } catch {
    return null
  }
}

import { prisma } from "@/lib/prisma"
import { normalizeDate } from "@/lib/financial"

export async function updateTransactionDate(
  id: string,
  userId: string,
  date: string
) {
  const existing = await prisma.transaction.findFirst({
    where: {
      id,
      userId,
    },
    select: { id: true },
  })

  if (!existing) return null

  const transaction = await prisma.transaction.update({
    where: { id },
    data: { date: normalizeDate(date) },
  })

  return transaction
}

import { prisma } from "@/lib/prisma"
import { isValidPeriod } from "@/lib/financial"

export async function updateTransactionPeriod(
  id: string,
  userId: string,
  period: string
) {
  if (!isValidPeriod(period)) {
    return { error: "invalid_period" as const }
  }

  const existing = await prisma.transaction.findFirst({
    where: { id, userId },
    select: { id: true },
  })

  if (!existing) return null

  const transaction = await prisma.transaction.update({
    where: { id },
    data: { period },
  })

  return transaction
}

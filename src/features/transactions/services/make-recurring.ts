import { prisma } from "@/lib/prisma"

export async function makeRecurring(id: string, userId: string) {
  const tx = await prisma.transaction.findFirst({
    where: { id, userId },
  })

  if (!tx) return null

  const recurring = await prisma.recurringTransaction.create({
    data: {
      id: crypto.randomUUID(),
      period: tx.period,
      note: tx.note,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      userId: tx.userId,
      accountId: tx.accountId,
      groupCode: tx.groupCode,
      categoryCode: tx.categoryCode,
      statusCode: tx.statusCode,
      payeeId: tx.payeeId,
      reference: tx.reference,
      lastDate: tx.date,
    },
  })

  return recurring
}

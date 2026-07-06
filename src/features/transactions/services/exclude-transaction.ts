import { prisma } from "@/lib/prisma"

export async function excludeTransaction(id: string, userId: string) {
  const result = await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.findFirst({
      where: { id, userId },
    })
    if (!transaction) return null

    // Defensive cleanup in case the same id was already copied before.
    await tx.excludedTransaction.deleteMany({
      where: { id: transaction.id, userId },
    })

    await tx.excludedTransaction.create({
      data: {
        id: transaction.id,
        num: transaction.num,
        period: transaction.period,
        date: transaction.date,
        reference: transaction.reference,
        note: transaction.note,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        userId: transaction.userId,
        accountId: transaction.accountId,
        destAccountId: transaction.destAccountId,
        groupCode: transaction.groupCode,
        categoryCode: transaction.categoryCode,
        statusCode: transaction.statusCode,
        payeeId: transaction.payeeId,
      },
    })

    await tx.transaction.delete({
      where: { id: transaction.id },
    })

    return { success: true }
  })

  return result
}

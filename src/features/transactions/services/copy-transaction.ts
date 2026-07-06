import { prisma } from "@/lib/prisma"
import { periodFromDate } from "@/lib/financial"
import { createTransaction } from "./create-transaction"

export async function copyTransaction(
  transactionId: string,
  targetDate: string,
  userId: string
) {
  const original = await prisma.transaction.findUnique({
    where: {
      id: transactionId,
      userId,
    },
    include: {
      category: true,
      payee: true,
    },
  })

  if (!original) {
    throw new Error("Transação não encontrada ou acesso negado.")
  }

  // Cria um clone estruturado com base no payload da original
  // Mas ignoramos campos únicos, num e status de pagamento (se houver lógica).
  // Apenas metadados financeiros.
  const input = {
    userId,
    date: targetDate,
    period: periodFromDate(targetDate),
    reference: original.reference ?? undefined,
    note: original.note ?? undefined,
    description: original.description ?? undefined,
    amount: original.amount,
    type: original.type,
    accountId: original.accountId,
    groupCode: original.groupCode,
    categoryCode: original.categoryCode,
    statusCode: Number(original.statusCode),
    payeeId: original.payeeId ?? undefined,
    destAccountId: original.destAccountId ?? undefined,
  }

  return createTransaction(input)
}

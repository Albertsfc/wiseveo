import { prisma } from "@/lib/prisma"

export interface LatestTransactionItem {
  id: string
  title: string
  categoryName: string
  groupName: string
  date: string
  amount: number
}

function toUtcDateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate(),
  ).padStart(2, "0")}`
}

function pickTitle(input: {
  description: string | null
  note: string | null
  reference: string | null
  payeeName: string | null
  categoryName: string
}): string {
  const preferred =
    input.description?.trim() ||
    input.payeeName?.trim() ||
    input.note?.trim() ||
    input.reference?.trim() ||
    input.categoryName

  return preferred.toUpperCase()
}

const paidStatusFilters = [
  { statusLookup: { is: { name: { equals: "PAGO", mode: "insensitive" as const } } } },
  { statusLookup: { is: { name: { equals: "PAID", mode: "insensitive" as const } } } },
  { statusLookup: { is: { name: { equals: "PAGA", mode: "insensitive" as const } } } },
  { statusLookup: { is: { name: { equals: "REALIZADO", mode: "insensitive" as const } } } },
  { statusLookup: { is: { name: { equals: "QUITADO", mode: "insensitive" as const } } } },
]

export async function getLatestTransactions(
  userId: string,
  from: Date,
  to: Date,
  take = 60,
): Promise<LatestTransactionItem[]> {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: from, lte: to },
      OR: paidStatusFilters,
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take,
    select: {
      id: true,
      date: true,
      amount: true,
      description: true,
      note: true,
      reference: true,
      payee: { select: { name: true } },
      category: {
        select: {
          name: true,
          group: { select: { name: true } },
        },
      },
      account: { select: { name: true } },
    },
  })

  return transactions.map((tx) => ({
    id: tx.id,
    title: pickTitle({
      description: tx.description,
      note: tx.note,
      reference: tx.reference,
      payeeName: tx.payee?.name ?? null,
      categoryName: tx.category.name,
    }),
    categoryName: tx.category.name.toUpperCase(),
    groupName: (tx.category.group.name || tx.account.name).toUpperCase(),
    date: toUtcDateKey(tx.date),
    amount: Number(tx.amount),
  }))
}

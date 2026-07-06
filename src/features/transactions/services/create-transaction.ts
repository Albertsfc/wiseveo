import { prisma } from "@/lib/prisma"
import { normalizeDate, periodFromDate, isValidPeriod } from "@/lib/financial"

interface CreateTransactionInput {
  userId: string
  date: string
  period?: string
  reference?: string
  note?: string
  description?: string
  amount: number
  type: "INCOME" | "EXPENSE" | "TRANSFER"
  accountId: number
  groupCode: number
  categoryCode: string
  statusCode: number
  payeeId?: number
  payeeName?: string
  destAccountId?: number
}

async function resolvePayeeId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId: string,
  payeeId?: number,
  payeeName?: string
): Promise<number | null> {
  if (payeeId) {
    const existing = await tx.payee.findFirst({
      where: { id: payeeId, userId },
      select: { id: true },
    })
    if (existing) return existing.id
  }

  const trimmed = payeeName?.trim()
  if (!trimmed) return payeeId ?? null

  const existingByName = await tx.payee.findFirst({
    where: {
      userId,
      name: { equals: trimmed, mode: "insensitive" },
    },
    select: { id: true },
  })
  if (existingByName) return existingByName.id

  const nextIdResult = await tx.$queryRaw<Array<{ next_id: number }>>`
    SELECT COALESCE(MAX("COD_BEN"), 0) + 1 AS next_id FROM payees
  `
  const nextPayeeId = Number(nextIdResult[0]?.next_id ?? 1)

  const created = await tx.payee.create({
    data: { id: nextPayeeId, name: trimmed, userId },
    select: { id: true },
  })
  return created.id
}

export async function createTransaction(input: CreateTransactionInput) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`LOCK TABLE transactions IN EXCLUSIVE MODE`

    const result = await tx.$queryRaw<[{ next_num: number }]>`
      SELECT COALESCE(MAX("NUM"), 0) + 1 AS next_num
      FROM transactions
      WHERE user_id = ${input.userId}
    `
    const nextNum = Number(result[0].next_num)

    // Sign determined by the category's actual type in the DB (not the tab type).
    // A "TRANSFER" tab may contain EXPENSE or INCOME categories — the category wins.
    const category = await tx.category.findUnique({
      where: { code: input.categoryCode },
      select: { type: true },
    })
    const effectiveType = category?.type ?? input.type

    const absAmount = Math.abs(input.amount)
    const finalAmount = effectiveType === "EXPENSE" ? -absAmount : absAmount

    const resolvedPayeeId = await resolvePayeeId(
      tx,
      input.userId,
      input.payeeId,
      input.payeeName
    )

    const period =
      input.period && isValidPeriod(input.period)
        ? input.period
        : periodFromDate()

    return tx.transaction.create({
      data: {
        id: crypto.randomUUID(),
        num: nextNum,
        period,
        date: normalizeDate(input.date),
        reference: input.reference?.trim() || null,
        note: input.note?.trim() || null,
        description: input.description?.trim() || null,
        amount: finalAmount,
        type: input.type,
        userId: input.userId,
        accountId: input.accountId,
        groupCode: input.groupCode,
        categoryCode: input.categoryCode,
        statusCode: input.statusCode,
        payeeId: resolvedPayeeId,
        destAccountId: input.destAccountId ?? null,
      },
    })
  })
}

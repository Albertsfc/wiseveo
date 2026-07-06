import { prisma } from "@/lib/prisma"
import { safeBalance } from "@/lib/financial"

export interface DailyStatementEntry {
  date: string       // "YYYY-MM-DD"
  income: number
  expense: number
  net: number
  accumulated: number
}

/**
 * Builds a daily statement with running (accumulated) balance for a date range.
 *
 * 1. Computes the opening balance: Σ account.initialBalance + Σ transactions
 *    *before* `from`.
 * 2. For each day in the range that has activity, accumulates income/expense
 *    and a running balance.
 *
 * Days with zero movement are omitted from the result.
 */
export async function getDailyStatement(
  userId: string,
  from: Date,
  to: Date,
): Promise<DailyStatementEntry[]> {
  // --- opening balance ---------------------------------------------------
  const [accounts, txBeforeAgg] = await Promise.all([
    prisma.account.findMany({
      where: { userId, active: true },
      select: { balance: true },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        date: { lt: from },
      },
    }),
  ])

  const initialSum = accounts.reduce(
    (sum, acc) => sum + safeBalance(acc.balance),
    0,
  )
  let runningBalance = initialSum + (txBeforeAgg._sum.amount ?? 0)

  // --- transactions in range --------------------------------------------
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: from, lte: to },
    },
    orderBy: { date: "asc" },
    select: { date: true, amount: true, type: true },
  })

  // Bucket by day
  const dailyMap = new Map<
    string,
    { income: number; expense: number; net: number }
  >()

  for (const tx of transactions) {
    const d = tx.date
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`

    let entry = dailyMap.get(key)
    if (!entry) {
      entry = { income: 0, expense: 0, net: 0 }
      dailyMap.set(key, entry)
    }

    if (tx.type === "INCOME") {
      entry.income += tx.amount
    } else {
      entry.expense += Math.abs(tx.amount)
    }
    entry.net += tx.amount
  }

  // Build result in chronological order
  const sortedKeys = Array.from(dailyMap.keys()).sort()
  const result: DailyStatementEntry[] = []

  for (const key of sortedKeys) {
    const day = dailyMap.get(key)!
    runningBalance += day.net
    result.push({
      date: key,
      income: day.income,
      expense: day.expense,
      net: day.net,
      accumulated: runningBalance,
    })
  }

  return result
}

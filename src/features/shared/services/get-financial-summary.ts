import { prisma } from "@/lib/prisma"

export interface FinancialSummary {
  income: number
  expense: number
  savings: number
}

/**
 * Aggregates income, expense and savings for a user within a date range.
 *
 * - `income`  = sum of INCOME transactions (positive values)
 * - `expense` = |sum of EXPENSE transactions| + |sum of negative TRANSFER transactions|
 * - `savings` = income − expense
 *
 * Negative transfers (money leaving an account via transfer) are counted as
 * outflow so the expense total reflects *all* money that left the user's
 * accounts during the period.
 */
export async function getFinancialSummary(
  userId: string,
  from: Date,
  to: Date,
): Promise<FinancialSummary> {
  const dateFilter = { gte: from, lte: to }

  const [incomeAgg, expenseAgg, transferOutAgg] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        date: dateFilter,
        type: "INCOME",
      },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        date: dateFilter,
        type: "EXPENSE",
      },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        date: dateFilter,
        type: "TRANSFER",
        amount: { lt: 0 },
      },
    }),
  ])

  const income = incomeAgg._sum.amount ?? 0
  const expenseRaw = expenseAgg._sum.amount ?? 0       // already negative
  const transferOut = transferOutAgg._sum.amount ?? 0   // already negative
  const totalOutflow = Math.abs(expenseRaw) + Math.abs(transferOut)

  return {
    income,
    expense: totalOutflow,
    savings: income - totalOutflow,
  }
}

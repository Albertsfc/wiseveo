import { prisma } from "@/lib/prisma"
import { safeBalance } from "@/lib/financial"
import type { AccountWithBalance } from "../types"

/**
 * Returns all active accounts for a user with their computed balance.
 *
 * @param toDate  Optional temporal cut-off. When provided, only transactions
 *                with `date <= toDate` are included in the balance sum.
 *                When omitted the balance includes every non-excluded
 *                transaction (current behaviour, fully backwards-compatible).
 */
export async function getAccountsWithBalance(
    userId: string,
    toDate?: Date,
): Promise<AccountWithBalance[]> {
    const accounts = await prisma.account.findMany({
        where: { userId, active: true },
        orderBy: { name: "asc" },
    })

    // Single groupBy query instead of N individual aggregates
    const txSums = await prisma.transaction.groupBy({
        by: ["accountId"],
        _sum: { amount: true },
        where: {
            userId,
            ...(toDate ? { date: { lte: toDate } } : {}),
        },
    })

    const sumByAccount = new Map<number, number>()
    for (const row of txSums) {
        sumByAccount.set(row.accountId, row._sum.amount ?? 0)
    }

    return accounts.map((account) => {
        const initial = safeBalance(account.balance)
        const txSum = sumByAccount.get(account.id) ?? 0
        return {
            id: account.id,
            name: account.name,
            type: account.type,
            initialBalance: initial,
            currentBalance: initial + txSum,
            legacyDate: account.legacyDate.toISOString(),
        }
    })
}

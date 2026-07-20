import { NextResponse } from "next/server"
import { startOfMonth, endOfMonth, subMonths } from "date-fns"
import { getTranslations } from "next-intl/server"

import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"
import { getAccountsWithBalance } from "@/features/accounts/services/get-accounts"
import { getFinancialSummary } from "@/features/shared/services/get-financial-summary"

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100
  return ((current - previous) / Math.abs(previous)) * 100
}

export async function GET() {
  const userId = await getDefaultUserId()
  if (!userId) {
    const t = await getTranslations("api.errors")
    return NextResponse.json({ error: t("userNotFound") }, { status: 401 })
  }

  const now = new Date()
  const from = startOfMonth(now)
  const to = endOfMonth(now)
  const prevFrom = startOfMonth(subMonths(now, 1))
  const prevTo = endOfMonth(subMonths(now, 1))

  const [accounts, current, previous, prevAccounts] = await Promise.all([
    getAccountsWithBalance(userId),
    getFinancialSummary(userId, from, to),
    getFinancialSummary(userId, prevFrom, prevTo),
    getAccountsWithBalance(userId, prevTo),
  ])

  const totalBalance = accounts.reduce((s, a) => s + a.currentBalance, 0)
  const prevTotalBalance = prevAccounts.reduce((s, a) => s + a.currentBalance, 0)

  return NextResponse.json({
    balance: { total: totalBalance, change: pctChange(totalBalance, prevTotalBalance) },
    income:  { value: current.income,  change: pctChange(current.income,  previous.income) },
    expense: { value: current.expense, change: pctChange(current.expense, previous.expense) },
    savings: { value: current.savings, change: pctChange(current.savings, previous.savings) },
  })
}

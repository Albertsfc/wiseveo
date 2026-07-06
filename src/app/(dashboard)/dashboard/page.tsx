import { endOfMonth, startOfMonth, subMonths } from "date-fns"

import { getAccountsWithBalance } from "@/features/accounts/services/get-accounts"
import { ChartAreaInteractive } from "@/features/dashboard/components/chart-area-interactive"
import { DashboardRowThree } from "@/features/dashboard/components/dashboard-row-three"
import { ExpensesByGroupChart } from "@/features/dashboard/components/expenses-by-group-chart"
import { SectionCards } from "@/features/dashboard/components/section-cards"
import { getFinancialSummary } from "@/features/shared/services/get-financial-summary"
import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100
  return ((current - previous) / Math.abs(previous)) * 100
}

export default async function Page() {
  const userId = await getDefaultUserId()

  if (!userId) {
    return (
      <div className="flex h-96 items-center justify-center px-4 md:px-6">
        <p className="text-muted-foreground">
          Nenhum usuário encontrado. Faça login para ver o dashboard.
        </p>
      </div>
    )
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

  const totalBalance = accounts.reduce((sum, account) => {
    return sum + account.currentBalance
  }, 0)
  const prevTotalBalance = prevAccounts.reduce((sum, account) => {
    return sum + account.currentBalance
  }, 0)

  return (
    <>

      <div className="@container/main space-y-6 px-4 lg:px-6">
        <SectionCards
          balance={{
            total: totalBalance,
            change: pctChange(totalBalance, prevTotalBalance),
          }}
          income={{
            value: current.income,
            change: pctChange(current.income, previous.income),
          }}
          expense={{
            value: current.expense,
            change: pctChange(current.expense, previous.expense),
          }}
          savings={{
            value: current.savings,
            change: pctChange(current.savings, previous.savings),
          }}
        />

        <div className="grid grid-cols-12 items-stretch gap-4">
          <div className="col-span-12 lg:col-span-8">
            <ChartAreaInteractive />
          </div>
          <div className="col-span-12 lg:col-span-4">
            <ExpensesByGroupChart />
          </div>
        </div>

        <DashboardRowThree />
      </div>
    </>
  )
}

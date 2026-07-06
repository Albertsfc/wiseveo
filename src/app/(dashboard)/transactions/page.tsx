import { startOfMonth, endOfMonth } from "date-fns"

import { getTransactions } from "@/features/transactions/services/get-transactions"
import { getFormOptions } from "@/features/transactions/services/get-form-options"
import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"
import { getAccountsWithBalance } from "@/features/accounts/services/get-accounts"
import { getFinancialSummary } from "@/features/shared/services/get-financial-summary"
import { TransactionsClient } from "@/features/transactions/components/transactions-client"

export default async function TransactionsPage() {
  const userId = await getDefaultUserId()

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-96 px-4 md:px-6">
        <p className="text-muted-foreground">
          Nenhum usuário encontrado. Faça login para ver suas transações.
        </p>
      </div>
    )
  }

  const now = new Date()
  const from = startOfMonth(now)
  const to = endOfMonth(now)

  const [
    { transactions, filterOptions },
    formOptions,
    balancesAtDate,
    balancesAtEndOfMonth,
    summary,
  ] = await Promise.all([
    getTransactions({ userId, from, to }),
    getFormOptions(userId),
    getAccountsWithBalance(userId, to),
    getAccountsWithBalance(userId, to),
    getFinancialSummary(userId, from, to),
  ])

  return (
    <TransactionsClient
      initialTransactions={transactions}
      initialFilterOptions={filterOptions}
      formOptions={formOptions}
      initialBalancesAtDate={balancesAtDate}
      initialBalancesAtEndOfMonth={balancesAtEndOfMonth}
      initialSummary={summary}
    />
  )
}

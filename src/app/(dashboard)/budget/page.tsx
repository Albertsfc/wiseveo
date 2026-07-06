import { Wallet } from "lucide-react"
import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"
import { getBudgetData } from "@/features/budget/services/get-budget-data"
import { BudgetClient } from "@/features/budget/components/budget-client"
import { BudgetHeaderActions } from "@/features/budget/components/budget-header-actions"

export default async function BudgetPage() {
  const userId = await getDefaultUserId()

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-96 px-4 md:px-6">
        <p className="text-muted-foreground">
          Nenhum usuário encontrado. Faça login para ver o orçamento.
        </p>
      </div>
    )
  }

  const data = await getBudgetData(userId)

  return (
    <>
      {/* Page Actions */}
      <div className="flex justify-end px-4 lg:px-6 mb-4">
        <BudgetHeaderActions groups={data.groups} />
      </div>

      <BudgetClient data={data} />
    </>
  )
}

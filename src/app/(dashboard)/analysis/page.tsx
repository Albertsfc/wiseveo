import { Calculator } from "lucide-react"

import { AnalysisClient } from "@/features/analysis/components/analysis-client"
import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"

export default async function AnalysisPage() {
  const userId = await getDefaultUserId()

  if (!userId) {
    return (
      <div className="flex h-96 items-center justify-center px-4 lg:px-6">
        <p className="text-muted-foreground">
          Nenhum usuário encontrado. Faça login para ver a análise.
        </p>
      </div>
    )
  }

  return (
    <>

      <AnalysisClient />
    </>
  )
}

import { Calculator } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { AnalysisClient } from "@/features/analysis/components/analysis-client"
import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"

export default async function AnalysisPage() {
  const userId = await getDefaultUserId()

  if (!userId) {
    const t = await getTranslations("common")
    return (
      <div className="flex h-96 items-center justify-center px-4 lg:px-6">
        <p className="text-muted-foreground">
          {t("noUserFound")}
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

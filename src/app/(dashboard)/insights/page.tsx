import { getTranslations } from "next-intl/server"

import { InsightsClient } from "@/features/insights/components/insights-client"
import { getInsightsData } from "@/features/insights/services/get-insights-data"
import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"

export default async function InsightsPage() {
  const userId = await getDefaultUserId()

  if (!userId) {
    const t = await getTranslations("common")
    return (
      <div className="flex h-96 items-center justify-center px-4 lg:px-6">
        <p className="text-muted-foreground">{t("noUserFound")}</p>
      </div>
    )
  }

  const data = await getInsightsData(userId)

  return (
    <div className="flex-1 space-y-6 px-4 pt-0 lg:px-6">
      <InsightsClient data={data} />
    </div>
  )
}

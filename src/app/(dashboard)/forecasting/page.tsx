import { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ForecastingClient } from "@/features/forecasting/components/forecasting-client"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Routes.forecasting")

  return {
    title: `${t("title")} | WISEVEO`,
    description: t("description"),
  }
}

export default async function ForecastingPage() {
  const t = await getTranslations("Routes.forecasting")

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
      </div>
      <ForecastingClient />
    </div>
  )
}

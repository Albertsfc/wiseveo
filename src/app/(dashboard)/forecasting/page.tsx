import { Metadata } from "next"
import { ForecastingClient } from "@/features/forecasting/components/forecasting-client"

export const metadata: Metadata = {
  title: "Forecasting | WISEVEO",
  description: "Projeções financeiras futuras e análise de tendências.",
}

export default function ForecastingPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Forecasting</h2>
      </div>
      <ForecastingClient />
    </div>
  )
}

"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { ForecastingSettings } from "./forecasting-settings"
import { ForecastingDataTable } from "./data-table"
import type { ForecastingData } from "../types"
import { Skeleton } from "@/components/ui/skeleton"

export function ForecastingClient() {
  const t = useTranslations("forecasting")
  const searchParams = useSearchParams()
  const baseDate = searchParams.get("baseDate") || (() => {
    const d = new Date()
    // Último mês fechado = mês anterior ao corrente
    return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`
  })()
  const mode = searchParams.get("mode") || "CAIXA"
  const model = searchParams.get("model") || "MOVING_AVERAGE"
  const showAv = searchParams.get("showAv") !== "false"
  const showAh = searchParams.get("showAh") !== "false"

  const [data, setData] = React.useState<ForecastingData | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let isCancelled = false

    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          // The API schema expects YYYY-MM-DD
          baseDate: `${baseDate}-01`, 
          mode,
          model,
        })
        const res = await fetch(`/api/forecasting?${params.toString()}`)
        if (!res.ok) throw new Error(t("client.fetchError"))
        const payload = await res.json()
        if (!isCancelled) setData(payload)
      } catch (err) {
        console.error("Failed to fetch forecasting data:", err)
        if (!isCancelled) setError(t("client.loadError"))
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetchData()

    return () => { isCancelled = true }
  }, [baseDate, mode, model, t])

  return (
    <div className="flex flex-col gap-6">
      <ForecastingSettings />
      
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      )}

      {data && (
        <ForecastingDataTable data={data} showAv={showAv} showAh={showAh} loading={loading} />
      )}
    </div>
  )
}

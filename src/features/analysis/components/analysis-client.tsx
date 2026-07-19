"use client"

import * as React from "react"
import { format } from "date-fns"
import { useLocale, useTranslations } from "next-intl"

import { useDateRange } from "@/contexts/date-range-context"
import { formatAppDate } from "@/i18n/format"
import { AnalysisOverviewCard } from "./analysis-overview-card"
import { AnalysisStatementCard } from "./analysis-statement-card"
import { AnalysisSummaryCards } from "./analysis-summary-cards"
import type { DreData } from "../types"

function formatPeriodLabel(from: Date, to: Date, locale: string): string {
  return `${formatAppDate(from, "dd/MM/yyyy", locale)} - ${formatAppDate(to, "dd/MM/yyyy", locale)}`
}

export function AnalysisClient() {
  const t = useTranslations("analysis")
  const locale = useLocale()
  const { dateRange } = useDateRange()
  const [data, setData] = React.useState<DreData | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let isCancelled = false

    async function fetchDre() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          from: format(dateRange.from, "yyyy-MM-dd"),
          to: format(dateRange.to, "yyyy-MM-dd"),
        })

        const res = await fetch(`/api/analysis/dre?${params.toString()}`, {
          cache: "no-store",
        })

        if (!res.ok) {
          throw new Error(t("client.fetchError"))
        }

        const payload = (await res.json()) as DreData
        if (!isCancelled) {
          setData(payload)
        }
      } catch (fetchError) {
        console.error("Failed to fetch DRE data:", fetchError)
        if (!isCancelled) {
          setData(null)
          setError(t("client.loadError"))
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchDre()

    return () => {
      isCancelled = true
    }
  }, [dateRange.from, dateRange.to, t])

  const periodLabel = React.useMemo(
    () => formatPeriodLabel(dateRange.from, dateRange.to, locale),
    [dateRange.from, dateRange.to, locale],
  )

  return (
    <div className="@container/main space-y-6 px-4 lg:px-6">
      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <AnalysisSummaryCards data={data} loading={loading} />

      <div className="grid grid-cols-12 items-stretch gap-4">
        <div className="col-span-12 lg:col-span-8">
          <AnalysisStatementCard data={data} loading={loading} />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <AnalysisOverviewCard
            data={data}
            loading={loading}
            periodLabel={periodLabel}
          />
        </div>
      </div>
    </div>
  )
}

"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  BudgetPacingCard,
  BurnRateCard,
  CashProjectionCard,
  EmergencyRunwayCard,
  FixedCommitmentCard,
  MonthEndForecastCard,
  OverdueCostCard,
  PersonalRunwayCard,
  RecurringLoadCard,
  SafeToSpendCard,
  SavingsRateCard,
  SpendingAnomalyCard,
} from "./kpi-cards"
import type { InsightsData, KpiSection } from "../types"

type SectionFilter = KpiSection | "all"

const SECTION_ORDER: KpiSection[] = ["today", "patterns", "projections"]
const FILTER_ORDER: SectionFilter[] = ["all", ...SECTION_ORDER]

export function InsightsClient({ data }: { data: InsightsData }) {
  const t = useTranslations("insights")
  const [filter, setFilter] = React.useState<SectionFilter>("all")

  const sections: Record<KpiSection, React.ReactNode[]> = {
    today: [
      <SafeToSpendCard key="safeToSpend" kpi={data.safeToSpend} />,
      <EmergencyRunwayCard key="emergencyRunway" kpi={data.emergencyRunway} />,
      <BudgetPacingCard key="budgetPacing" kpi={data.budgetPacing} />,
    ],
    patterns: [
      <SavingsRateCard key="savingsRate" kpi={data.savingsRate} />,
      <BurnRateCard key="burnRate" kpi={data.burnRate} />,
      <SpendingAnomalyCard key="spendingAnomaly" kpi={data.spendingAnomaly} />,
      <FixedCommitmentCard key="fixedCommitment" kpi={data.fixedCommitment} />,
      <RecurringLoadCard key="recurringLoad" kpi={data.recurringLoad} />,
      <OverdueCostCard key="overdueCost" kpi={data.overdueCost} />,
    ],
    projections: [
      <CashProjectionCard key="cashProjection" kpi={data.cashProjection} />,
      <MonthEndForecastCard key="monthEndForecast" kpi={data.monthEndForecast} />,
      <PersonalRunwayCard key="personalRunway" kpi={data.personalRunway} />,
    ],
  }

  const visibleSections =
    filter === "all" ? SECTION_ORDER : SECTION_ORDER.filter((s) => s === filter)

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div
          className="flex flex-wrap items-center gap-2"
          role="tablist"
          aria-label={t("sectionsLabel")}
        >
          {FILTER_ORDER.map((section) => (
            <button
              key={section}
              type="button"
              role="tab"
              aria-selected={filter === section}
              onClick={() => setFilter(section)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm transition-colors",
                filter === section
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {t(`sections.${section}`)}
            </button>
          ))}
        </div>

        {visibleSections.map((section) => (
          <section key={section} className="space-y-3">
            {filter === "all" && (
              <h2 className="text-sm font-medium text-muted-foreground">
                {t(`sections.${section}`)}
              </h2>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sections[section]}
            </div>
          </section>
        ))}
      </div>
    </TooltipProvider>
  )
}

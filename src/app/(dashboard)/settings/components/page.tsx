"use client"

import { useTranslations } from "next-intl"

import { ChartAreaInteractiveLibrary } from "@/features/component-library/components/chart-area-interactive-library"
import { DataTable } from "@/features/component-library/components/data-table"

import data from "@/features/component-library/data/data.json"
import pastPerformanceData from "@/features/component-library/data/past-performance-data.json"
import keyPersonnelData from "@/features/component-library/data/key-personnel-data.json"
import focusDocumentsData from "@/features/component-library/data/focus-documents-data.json"

import { MetricsOverview } from "@/features/component-library/components/metrics-overview"
import { SalesChart } from "@/features/component-library/components/sales-chart"
import { RecentTransactions } from "@/features/component-library/components/recent-transactions"
import { TopProducts } from "@/features/component-library/components/top-products"
import { CustomerInsights } from "@/features/component-library/components/customer-insights"
import { QuickActions } from "@/features/component-library/components/quick-actions"
import { RevenueBreakdown } from "@/features/component-library/components/revenue-breakdown"

export default function ComponentsPage() {
    const t = useTranslations("settings.componentsShowcase")

    return (
        <div className="flex flex-col gap-8 pb-10">

            <div className="space-y-10">
                {/* Insights Section */}
                <section className="space-y-4">
                    <div className="px-4 lg:px-6">
                        <h2 className="text-xl font-semibold tracking-tight">{t("insightsTitle")}</h2>
                        <p className="text-sm text-muted-foreground">
                            {t("insightsDescription")}
                        </p>
                    </div>
                    <div className="px-4 lg:px-6">
                        <div className="@container/main space-y-6">
                            <div className="flex justify-end">
                                <QuickActions />
                            </div>
                            <MetricsOverview />
                            <div className="grid gap-6 grid-cols-1 @5xl:grid-cols-2">
                                <SalesChart />
                                <RevenueBreakdown />
                            </div>
                            <div className="grid gap-6 grid-cols-1 @5xl:grid-cols-2">
                                <RecentTransactions />
                                <TopProducts />
                            </div>
                            <CustomerInsights />
                        </div>
                    </div>
                </section>

                {/* Gráficos Section */}
                <section className="space-y-4">
                    <div className="px-4 lg:px-6">
                        <h2 className="text-xl font-semibold tracking-tight">{t("chartsTitle")}</h2>
                        <p className="text-sm text-muted-foreground">
                            {t("chartsDescription")}
                        </p>
                    </div>
                    <div className="px-4 lg:px-6">
                        <ChartAreaInteractiveLibrary />
                    </div>
                </section>

                {/* Tabelas Section */}
                <section className="space-y-4">
                    <div className="px-4 lg:px-6">
                        <h2 className="text-xl font-semibold tracking-tight">{t("tablesTitle")}</h2>
                        <p className="text-sm text-muted-foreground">
                            {t("tablesDescription")}
                        </p>
                    </div>
                    <div className="@container/main">
                        <DataTable
                            data={data}
                            pastPerformanceData={pastPerformanceData}
                            keyPersonnelData={keyPersonnelData}
                            focusDocumentsData={focusDocumentsData}
                        />
                    </div>
                </section>
            </div>
        </div>
    )
}

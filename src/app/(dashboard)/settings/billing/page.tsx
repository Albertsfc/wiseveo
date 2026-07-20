"use client"

import { useLocale, useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PricingPlans } from "@/components/pricing-plans"
import { CurrentPlanCard } from "./components/current-plan-card"
import { BillingHistoryCard } from "./components/billing-history-card"
import { resolveAppLocale } from "@/i18n/config"

// Import data
import currentPlanData from "./data/current-plan.json"
import billingHistoryData from "./data/billing-history.json"
import plansPtBR from "../../pricing/data/plans.pt-BR.json"
import plansEnUS from "../../pricing/data/plans.en-US.json"
import plansEs419 from "../../pricing/data/plans.es-419.json"

const plansByLocale = {
  "pt-BR": plansPtBR,
  "en-US": plansEnUS,
  "es-419": plansEs419,
}

export default function BillingSettings() {
  const t = useTranslations("templatePages.billing")
  const locale = resolveAppLocale(useLocale())
  const plansData = plansByLocale[locale]
  const handlePlanSelect = (planId: string) => {
    console.log('Plan selected:', planId)
    // Handle plan selection logic here
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <CurrentPlanCard plan={currentPlanData} />
          <BillingHistoryCard history={billingHistoryData} />
        </div>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("availablePlansTitle")}</CardTitle>
              <CardDescription>
                {t("availablePlansDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PricingPlans
                mode="billing"
                plans={plansData}
                currentPlanId="professional"
                onPlanSelect={handlePlanSelect}
              />
            </CardContent>
          </Card>
        </div>
      </div>
  )
}

"use client"

import {
  ArrowDownCircle,
  ArrowUpCircle,
  BadgePercent,
  Wallet,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SectionCardsGrid } from "@/components/section-cards-grid"
import { useMonetaryFormattingSafe } from "@/hooks/use-monetary-formatting"
import { formatPercentValue } from "@/lib/monetary"
import { cn } from "@/lib/utils"
import type { DreData } from "../types"

interface AnalysisSummaryCardsProps {
  data: DreData | null
  loading: boolean
}

function resolveResultLabel(net: number) {
  if (net > 0) return "Positivo"
  if (net < 0) return "Negativo"
  return "Equilíbrio"
}

export function AnalysisSummaryCards({
  data,
  loading,
}: AnalysisSummaryCardsProps) {
  const monetary = useMonetaryFormattingSafe()
  const summary = data?.summary
  const resultLabel = resolveResultLabel(summary?.net ?? 0)

  const cards = [
    {
      label: "Receitas",
      icon: ArrowUpCircle,
      value: loading
        ? "..."
        : monetary.formatMonetaryValue(summary?.income ?? 0),
      actionLabel: loading
        ? "Carregando"
        : `${summary?.incomeGroupCount ?? 0} grupos`,
      footerText: "Total de entradas consideradas na DRE",
      valueClassName: "text-chart-2",
    },
    {
      label: "Despesas",
      icon: ArrowDownCircle,
      value: loading
        ? "..."
        : monetary.formatAbsoluteMonetaryValue(summary?.expense ?? 0),
      actionLabel: loading
        ? "Carregando"
        : `${summary?.expenseGroupCount ?? 0} grupos`,
      footerText: "Saídas operacionais do período",
      valueClassName: "text-destructive",
    },
    {
      label: "Saldo Final",
      icon: Wallet,
      value: loading
        ? "..."
        : monetary.formatMonetaryValue(summary?.net ?? 0),
      actionLabel: loading ? "Carregando" : resultLabel,
      footerText: "Receitas, despesas e transferências do intervalo",
      valueClassName:
        (summary?.net ?? 0) < 0 ? "text-destructive" : "text-chart-2",
    },
    {
      label: "Margem",
      icon: BadgePercent,
      value: loading
        ? "..."
        : summary?.marginPercentage == null
          ? "n/d"
          : formatPercentValue(summary.marginPercentage, 1),
      actionLabel: loading
        ? "Carregando"
        : `${summary?.transactionCount ?? 0} lanç.`,
      footerText: "Resultado operacional dividido pelas receitas",
      valueClassName:
        summary?.marginPercentage != null && summary.marginPercentage < 0
          ? "text-destructive"
          : "text-foreground",
    },
  ]

  return (
    <SectionCardsGrid>
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <Card key={card.label} className="@container/card">
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <Icon className="size-4" />
                <span>{card.label}</span>
              </CardDescription>
              <CardTitle
                className={cn(
                  "text-2xl font-semibold tabular-nums @[250px]/card:text-3xl font-mono",
                  card.valueClassName,
                )}
              >
                {card.value}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">{card.actionLabel}</Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-2 font-medium">{card.footerText}</div>
              <div className="text-muted-foreground">
                {loading ? "Atualizando DRE..." : "Filtro aplicado pelo período da header"}
              </div>
            </CardFooter>
          </Card>
        )
      })}
    </SectionCardsGrid>
  )
}

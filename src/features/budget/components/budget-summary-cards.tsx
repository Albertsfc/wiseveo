"use client"

import {
  Target,
  ArrowDownCircle,
  PiggyBank,
  Gauge,
  Shield,
  AlertTriangle,
  Flame,
} from "lucide-react"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SectionCardsGrid } from "@/components/section-cards-grid"
import { formatPercentValue } from "@/lib/monetary"
import { useMonetaryFormattingSafe } from "@/hooks/use-monetary-formatting"

function getZoneInfo(pct: number) {
  if (pct <= 50)
    return {
      color: "text-chart-2",
      bgColor: "bg-chart-2/15",
      borderColor: "border-chart-2/30",
      Icon: Shield,
      label: "Seguro",
      footerText: "abaixo de 50%",
    }
  if (pct <= 80)
    return {
      color: "text-chart-4",
      bgColor: "bg-chart-4/15",
      borderColor: "border-chart-4/30",
      Icon: AlertTriangle,
      label: "Alerta",
      footerText: "entre 50% e 80%",
    }
  return {
    color: "text-destructive",
    bgColor: "bg-destructive/15",
    borderColor: "border-destructive/30",
    Icon: Flame,
    label: "Perigo",
    footerText: "acima de 80%",
  }
}

interface BudgetSummaryCardsProps {
  totalLimit: number
  totalSpent: number
  totalPaid: number
  totalScheduled: number
  overallPct: number
  itemCount: number
}

export function BudgetSummaryCards({
  totalLimit,
  totalSpent,
  totalPaid,
  totalScheduled,
  overallPct,
  itemCount,
}: BudgetSummaryCardsProps) {
  const monetary = useMonetaryFormattingSafe()
  const remaining = totalLimit - totalSpent
  const zone = getZoneInfo(overallPct)
  const remainingColor = remaining >= 0 ? "text-chart-2" : "text-destructive"
  const remainingLabel = remaining >= 0 ? "margem disponível" : "limite excedido"

  return (
    <SectionCardsGrid>
      {/* Card 1: Orçado Total */}
      <Card className="@container/card" style={{ background: "linear-gradient(to top, color-mix(in oklch, var(--primary) 5%, transparent), var(--card))" }}>
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <Target className="size-3.5" />
            Orçado Total
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl font-mono">
            {monetary.formatMonetaryValue(totalLimit)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {itemCount} {itemCount === 1 ? "item" : "itens"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="font-medium">Limite definido para o mês</div>
          <div className="text-muted-foreground">soma de todos os orçamentos</div>
        </CardFooter>
      </Card>

      {/* Card 2: Gasto Total */}
      <Card className="@container/card" style={{ background: "linear-gradient(to top, color-mix(in oklch, var(--primary) 5%, transparent), var(--card))" }}>
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <ArrowDownCircle className="size-3.5" />
            Gasto Total
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl font-mono text-destructive">
            {monetary.formatMonetaryValue(totalSpent)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {formatPercentValue(overallPct)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="font-medium">Despesas do período</div>
          <div className="text-muted-foreground text-xs">
            Pago: {monetary.formatMonetaryValue(totalPaid)} · Agendado: {monetary.formatMonetaryValue(totalScheduled)}
          </div>
        </CardFooter>
      </Card>

      {/* Card 3: Restante */}
      <Card className="@container/card" style={{ background: "linear-gradient(to top, color-mix(in oklch, var(--primary) 5%, transparent), var(--card))" }}>
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <PiggyBank className="size-3.5" />
            {remaining >= 0 ? "Restante" : "Excedido"}
          </CardDescription>
          <CardTitle
            className={`text-2xl font-semibold tabular-nums @[250px]/card:text-3xl font-mono ${remainingColor}`}
          >
            {monetary.formatMonetaryValue(remaining)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {formatPercentValue(100 - overallPct, 1, true)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="font-medium">
            {remaining >= 0 ? "Margem disponível" : "Acima do orçamento"}
          </div>
          <div className="text-muted-foreground">{remainingLabel}</div>
        </CardFooter>
      </Card>

      {/* Card 4: Utilização */}
      <Card className="@container/card" style={{ background: "linear-gradient(to top, color-mix(in oklch, var(--primary) 5%, transparent), var(--card))" }}>
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <Gauge className="size-3.5" />
            Utilização
          </CardDescription>
          <CardTitle
            className={`text-2xl font-semibold tabular-nums @[250px]/card:text-3xl font-mono ${zone.color}`}
          >
            {formatPercentValue(overallPct)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={`${zone.bgColor} ${zone.color} ${zone.borderColor}`}>
              <zone.Icon className="size-3" />
              <span className="ml-1">{zone.label}</span>
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="font-medium">Zona {zone.label.toLowerCase()}</div>
          <div className="text-muted-foreground">{zone.footerText}</div>
        </CardFooter>
      </Card>
    </SectionCardsGrid>
  )
}

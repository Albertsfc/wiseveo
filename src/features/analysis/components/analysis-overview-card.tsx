"use client"

import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarRange,
  Scale,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useMonetaryFormattingSafe } from "@/hooks/use-monetary-formatting"
import { formatPercentValue } from "@/lib/monetary"
import { cn } from "@/lib/utils"
import type { DreData, DreLineItem } from "../types"

interface AnalysisOverviewCardProps {
  data: DreData | null
  loading: boolean
  periodLabel: string
}

interface MetricBoxProps {
  label: string
  value: string
  valueClassName?: string
}

function MetricBox({ label, value, valueClassName }: MetricBoxProps) {
  return (
    <div className="rounded-lg border bg-background/70 p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-1 text-sm font-semibold", valueClassName)}>{value}</p>
    </div>
  )
}

interface HighlightRowProps {
  label: string
  item: DreLineItem | null
  tone: "income" | "expense" | "transferIn" | "transferOut"
}

function HighlightRow({ label, item, tone }: HighlightRowProps) {
  const monetary = useMonetaryFormattingSafe()
  const isIncome = tone === "income"
  const isExpense = tone === "expense"
  const isTransferIn = tone === "transferIn"
  const Icon = isIncome
    ? TrendingUp
    : isExpense
      ? TrendingDown
      : isTransferIn
        ? ArrowUpCircle
        : ArrowDownCircle
  const valueClassName = isIncome
    ? "text-chart-2"
    : isExpense
      ? "text-destructive"
      : "text-primary"
  const value = isIncome || isTransferIn
    ? monetary.formatMonetaryValue(item?.amount ?? 0)
    : monetary.formatAbsoluteMonetaryValue(item?.amount ?? 0)

  return (
    <div className="rounded-lg border bg-background/70 p-3">
      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            "size-4",
            isIncome
              ? "text-chart-2"
              : isExpense
                ? "text-destructive"
                : "text-primary",
          )}
        />
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      </div>
      {item ? (
        <div className="mt-2 space-y-1">
          <p className="text-sm font-semibold">{item.groupName}</p>
          <p
            className={cn(
              "text-sm font-mono tabular-nums",
              valueClassName,
            )}
          >
            {value}
          </p>
          <p className="text-xs text-muted-foreground">
            {item.transactionCount} lançamentos ·{" "}
            {formatPercentValue(item.percentage, 1)}
          </p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Sem dados no período.
        </p>
      )}
    </div>
  )
}

function resolveResultLabel(net: number) {
  if (net > 0) return "Positivo"
  if (net < 0) return "Negativo"
  return "Equilíbrio"
}

export function AnalysisOverviewCard({
  data,
  loading,
  periodLabel,
}: AnalysisOverviewCardProps) {
  const monetary = useMonetaryFormattingSafe()
  const summary = data?.summary
  const resultLabel = resolveResultLabel(summary?.net ?? 0)

  return (
    <Card className="@container/card h-full bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card">
      <CardHeader>
        <CardTitle>Leitura do Período</CardTitle>
        <CardDescription>
          Contexto executivo da DRE selecionada
        </CardDescription>
        <CardAction>
          <Badge variant="outline" className="gap-1">
            <Scale className="size-3.5" />
            {loading ? "..." : resultLabel}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="rounded-lg border border-dashed bg-background/40 px-4 py-10 text-center text-sm text-muted-foreground">
            Carregando contexto do período...
          </div>
        ) : (
          <>
            <div className="rounded-lg border bg-background/70 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarRange className="size-4" />
                <p className="text-xs font-medium uppercase tracking-wide">
                  Período aplicado
                </p>
              </div>
              <p className="mt-2 text-sm font-semibold">{periodLabel}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {data?.periodDays ?? 0} dias corridos ·{" "}
                {summary?.transactionCount ?? 0} lançamentos considerados
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MetricBox
                label="Resultado operacional"
                value={monetary.formatMonetaryValue(summary?.operationalNet ?? 0)}
                valueClassName={
                  (summary?.operationalNet ?? 0) < 0
                    ? "text-destructive"
                    : "text-chart-2"
                }
              />
              <MetricBox
                label="Saldo final"
                value={monetary.formatMonetaryValue(summary?.net ?? 0)}
                valueClassName={
                  (summary?.net ?? 0) < 0
                    ? "text-destructive"
                    : "text-chart-2"
                }
              />
              <MetricBox
                label="Margem operacional"
                value={
                  summary?.marginPercentage == null
                    ? "n/d"
                    : formatPercentValue(summary.marginPercentage, 1)
                }
                valueClassName={
                  summary?.marginPercentage != null &&
                  summary.marginPercentage < 0
                    ? "text-destructive"
                    : undefined
                }
              />
              <MetricBox
                label="Saldo / dia"
                value={monetary.formatMonetaryValue(summary?.averageDailyNet ?? 0)}
                valueClassName={
                  (summary?.averageDailyNet ?? 0) < 0
                    ? "text-destructive"
                    : "text-chart-2"
                }
              />
              <MetricBox
                label="Entradas transf."
                value={monetary.formatMonetaryValue(summary?.transferIn ?? 0)}
                valueClassName="text-primary"
              />
              <MetricBox
                label="Saídas transf."
                value={monetary.formatAbsoluteMonetaryValue(summary?.transferOut ?? 0)}
                valueClassName="text-primary"
              />
            </div>

            <div className="space-y-3">
              <HighlightRow
                label="Maior grupo de receita"
                item={data?.topIncomeGroup ?? null}
                tone="income"
              />
              <HighlightRow
                label="Maior grupo de despesa"
                item={data?.topExpenseGroup ?? null}
                tone="expense"
              />
              <HighlightRow
                label="Maior entrada de transferência"
                item={data?.topTransferInGroup ?? null}
                tone="transferIn"
              />
              <HighlightRow
                label="Maior saída de transferência"
                item={data?.topTransferOutGroup ?? null}
                tone="transferOut"
              />
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="border-t flex-col items-start gap-1.5 text-xs text-muted-foreground">
        <p>
          O saldo final considera receitas, despesas e transferências do período.
        </p>
        <p>
          A margem continua refletindo o resultado operacional
          (`receitas - despesas`) para preservar a leitura da DRE.
        </p>
      </CardFooter>
    </Card>
  )
}

"use client"

import {
  ArrowDownCircle,
  ArrowRightLeft,
  ArrowUpCircle,
  ReceiptText,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useMonetaryFormattingSafe } from "@/hooks/use-monetary-formatting"
import { formatPercentValue } from "@/lib/monetary"
import { cn } from "@/lib/utils"
import type { DreData, DreLineItem } from "../types"

interface AnalysisStatementCardProps {
  data: DreData | null
  loading: boolean
}

interface StatementSectionProps {
  title: string
  items: DreLineItem[]
  total: number
  tone: "income" | "expense" | "transferIn" | "transferOut"
  totalLabel?: string
}

function StatementSection({
  title,
  items,
  total,
  tone,
  totalLabel,
}: StatementSectionProps) {
  const monetary = useMonetaryFormattingSafe()
  const isIncome = tone === "income"
  const isExpense = tone === "expense"
  const isTransferIn = tone === "transferIn"
  const Icon = isIncome
    ? ArrowUpCircle
    : isExpense
      ? ArrowDownCircle
      : isTransferIn
        ? ArrowUpCircle
        : ArrowDownCircle
  const accentClass = isIncome
    ? "text-chart-2"
    : isExpense
      ? "text-destructive"
      : "text-primary"
  const formattedTotal = isIncome || isTransferIn
    ? monetary.formatMonetaryValue(total)
    : monetary.formatAbsoluteMonetaryValue(total)

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon
            className={cn("size-4", accentClass)}
          />
          <h3 className="text-sm font-semibold uppercase tracking-wide">
            {title}
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {items.length} grupos
        </span>
      </div>

      {items.length ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={`${tone}-${item.groupCode}`}
              className="flex items-start justify-between gap-3 rounded-lg border bg-background/70 px-4 py-3"
            >
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm font-medium">{item.groupName}</p>
                <p className="text-xs text-muted-foreground">
                  {item.transactionCount} lançamentos ·{" "}
                  {formatPercentValue(item.percentage, 1)}
                </p>
              </div>
              <p
                className={cn(
                  "text-sm font-semibold font-mono tabular-nums",
                  accentClass,
                )}
              >
                {isIncome || isTransferIn
                  ? monetary.formatMonetaryValue(item.amount)
                  : monetary.formatAbsoluteMonetaryValue(item.amount)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-background/40 px-4 py-5 text-sm text-muted-foreground">
          Nenhum lançamento encontrado nesta seção para o período selecionado.
        </div>
      )}

      <div className="flex items-center justify-between gap-3 rounded-lg border bg-background px-4 py-3">
        <div>
          <p className="text-sm font-semibold">{totalLabel ?? (isIncome ? "Total de receitas" : "Total de despesas")}</p>
          <p className="text-xs text-muted-foreground">
            {isIncome || isTransferIn ? "(+)" : "(-)"} somatório consolidado do período
          </p>
        </div>
        <p
          className={cn(
            "text-sm font-semibold font-mono tabular-nums",
            accentClass,
          )}
        >
          {formattedTotal}
        </p>
      </div>
    </section>
  )
}

function TransferSection({ data }: { data: DreData | null }) {
  const monetary = useMonetaryFormattingSafe()
  const transferNet = (data?.summary.transferIn ?? 0) - (data?.summary.transferOut ?? 0)

  return (
    <section className="space-y-4 rounded-xl border bg-background/50 p-4">
      <div className="flex items-center gap-2">
        <ArrowRightLeft className="size-4 text-primary" />
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide">
            Transferência
          </h3>
          <p className="text-xs text-muted-foreground">
            Entradas e saídas mapeadas pelos grupos e categorias relacionados
          </p>
        </div>
      </div>

      <StatementSection
        title="Entradas"
        items={data?.transferInGroups ?? []}
        total={data?.summary.transferIn ?? 0}
        tone="transferIn"
        totalLabel="Total de entradas por transferência"
      />

      <StatementSection
        title="Saídas"
        items={data?.transferOutGroups ?? []}
        total={data?.summary.transferOut ?? 0}
        tone="transferOut"
        totalLabel="Total de saídas por transferência"
      />

      <div className="flex items-center justify-between gap-4 rounded-xl border bg-background px-4 py-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-wide">
            Saldo líquido de transferências
          </p>
          <p className="text-xs text-muted-foreground">
            (=) entradas menos saídas de transferências
          </p>
        </div>
        <p
          className={cn(
            "text-lg font-semibold font-mono tabular-nums",
            transferNet < 0 ? "text-destructive" : "text-primary",
          )}
        >
          {monetary.formatMonetaryValue(transferNet)}
        </p>
      </div>
    </section>
  )
}

export function AnalysisStatementCard({
  data,
  loading,
}: AnalysisStatementCardProps) {
  const monetary = useMonetaryFormattingSafe()
  const net = data?.summary.net ?? 0
  const operationalNet = data?.summary.operationalNet ?? 0

  return (
    <Card className="@container/card h-full bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card">
      <CardHeader>
        <CardTitle>DRE do Período</CardTitle>
        <CardDescription>
          Receitas, despesas e transferências consolidadas conforme o intervalo selecionado
        </CardDescription>
        <CardAction>
          <Badge variant="outline" className="gap-1">
            <ReceiptText className="size-3.5" />
            DRE + transf.
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="rounded-lg border border-dashed bg-background/40 px-4 py-10 text-center text-sm text-muted-foreground">
            Carregando a DRE do período...
          </div>
        ) : (
          <>
            <StatementSection
              title="Receitas"
              items={data?.incomeGroups ?? []}
              total={data?.summary.income ?? 0}
              tone="income"
            />

            <StatementSection
              title="Despesas"
              items={data?.expenseGroups ?? []}
              total={data?.summary.expense ?? 0}
              tone="expense"
            />

            <div className="flex items-center justify-between gap-4 rounded-xl border bg-background px-4 py-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-wide">
                  Resultado Operacional
                </p>
                <p className="text-xs text-muted-foreground">
                  (=) receitas menos despesas do exercício
                </p>
              </div>
              <p
                className={cn(
                  "text-lg font-semibold font-mono tabular-nums",
                  operationalNet < 0 ? "text-destructive" : "text-chart-2",
                )}
              >
                {monetary.formatMonetaryValue(operationalNet)}
              </p>
            </div>

            <TransferSection data={data} />

            <div className="flex items-center justify-between gap-4 rounded-xl border bg-background px-4 py-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-wide">
                  Saldo Final
                </p>
                <p className="text-xs text-muted-foreground">
                  (=) resultado operacional com entradas e saídas de transferências
                </p>
              </div>
              <p
                className={cn(
                  "text-xl font-semibold font-mono tabular-nums",
                  net < 0 ? "text-destructive" : "text-chart-2",
                )}
              >
                {monetary.formatMonetaryValue(net)}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

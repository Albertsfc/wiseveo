"use client"

import { TrendingUp } from "lucide-react"

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
import { SectionCardsGrid } from "@/components/section-cards-grid"
import { useMonetaryFormattingSafe } from "@/hooks/use-monetary-formatting"
import type { AccountWithBalance } from "@/features/accounts/types"
import type { FinancialSummary } from "@/features/shared/services/get-financial-summary"

// ---------------------------------------------------------------------------
// Account Balance Card (left card with per-account breakdown)
// ---------------------------------------------------------------------------

interface AccountBalanceCardProps {
  label: string
  accounts: AccountWithBalance[]
}

function AccountBalanceSection({ label, accounts }: AccountBalanceCardProps) {
  const monetary = useMonetaryFormattingSafe()
  const total = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0)

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex flex-col gap-1">
        {accounts.map((acc) => (
          <div key={acc.id} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground truncate max-w-[140px]">
              {acc.name}
            </span>
            <span
              className={`text-sm font-mono tabular-nums ${
                acc.currentBalance < 0
                  ? "text-destructive"
                  : "text-foreground"
              }`}
            >
              {monetary.formatMonetaryValue(acc.currentBalance)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t pt-1">
        <span className="text-sm font-semibold">Total</span>
        <span
          className={`text-sm font-semibold font-mono tabular-nums ${
            total < 0 ? "text-destructive" : "text-foreground"
          }`}
        >
          {monetary.formatMonetaryValue(total)}
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Summary Card (Entradas / Saídas / Saldo)
// ---------------------------------------------------------------------------

interface SummaryCardProps {
  label: string
  value: number
  variant: "income" | "expense" | "balance"
}

function SummaryCard({ label, value, variant }: SummaryCardProps) {
  const monetary = useMonetaryFormattingSafe()
  const colorClass =
    variant === "income"
      ? "text-chart-2"
      : variant === "expense"
        ? "text-destructive"
        : value >= 0
          ? "text-chart-2"
          : "text-destructive"

  const trendIcon =
    variant === "expense" ? null : <TrendingUp />

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className={`text-2xl font-semibold tabular-nums @[250px]/card:text-3xl font-mono ${colorClass}`}>
          {monetary.formatMonetaryValue(value)}
        </CardTitle>
        <CardAction>
          <Badge variant="outline">
            <TrendingUp />
            0.0%
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          {variant === "income" && "Entradas do período"}
          {variant === "expense" && "Saídas do período"}
          {variant === "balance" && "Saldo do período"}
          {trendIcon && <TrendingUp className="size-4" />}
        </div>
        <div className="text-muted-foreground">
          vs período anterior
        </div>
      </CardFooter>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Composed Cards Row
// ---------------------------------------------------------------------------

export interface BalanceSummaryData {
  balancesAtDate: AccountWithBalance[]
  balancesAtEndOfMonth: AccountWithBalance[]
  summary: FinancialSummary
  dateLabel: string
  endOfMonthLabel: string
}

export function BalanceSummaryCards({
  balancesAtDate,
  balancesAtEndOfMonth,
  summary,
  dateLabel,
  endOfMonthLabel,
}: BalanceSummaryData) {
  return (
    <SectionCardsGrid>
      {/* Account balances card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Saldos por Conta</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <AccountBalanceSection
            label={`Saldo em ${dateLabel}`}
            accounts={balancesAtDate}
          />
          <AccountBalanceSection
            label={`Saldo em ${endOfMonthLabel}`}
            accounts={balancesAtEndOfMonth}
          />
        </CardContent>
      </Card>

      {/* Summary cards */}
      <SummaryCard label="Entradas" value={summary.income} variant="income" />
      <SummaryCard label="Saídas" value={summary.expense} variant="expense" />
      <SummaryCard label="Saldo" value={summary.savings} variant="balance" />
    </SectionCardsGrid>
  )
}

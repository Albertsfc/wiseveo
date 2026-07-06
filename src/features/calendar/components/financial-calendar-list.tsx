"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { useMonetaryFormattingSafe } from "@/hooks/use-monetary-formatting"
import { cn } from "@/lib/utils"
import type { CalendarDayStatement } from "../types"

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
})

const TYPE_COLORS: Record<string, string> = {
  INCOME: "text-chart-2",
  EXPENSE: "text-destructive",
  TRANSFER: "text-chart-1",
}

const STATUS_LABELS: Record<string, string> = {
  PAID: "Pago",
  PENDING: "Pendente",
  OVERDUE: "Vencido",
  SCHEDULED: "Agendado",
}

interface FinancialCalendarListProps {
  days: CalendarDayStatement[]
  onSelectDate: (date: Date) => void
}

export function FinancialCalendarList({
  days,
  onSelectDate,
}: FinancialCalendarListProps) {
  const monetary = useMonetaryFormattingSafe()
  const daysWithTx = days.filter((d) => d.transactions.length > 0)

  if (daysWithTx.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-muted-foreground">
          Nenhuma transação no período selecionado
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto">
      {daysWithTx.map((day) => {
        const dateObj = new Date(day.date + "T12:00:00Z")

        return (
          <Card
            key={day.date}
            className="cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card"
            onClick={() => onSelectDate(dateObj)}
          >
            <CardHeader className="pb-2">
              <CardDescription className="capitalize">
                {dateFmt.format(dateObj)}
              </CardDescription>
              <CardTitle className="flex items-center justify-between text-base">
                <span>
                  {day.transactions.length} transaç
                  {day.transactions.length === 1 ? "ão" : "ões"}
                </span>
                <span
                  className={cn(
                    "font-mono",
                    day.net < 0 ? "text-destructive" : "text-chart-2",
                  )}
                >
                  {monetary.formatMonetaryValue(day.net)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {/* Opening */}
              <div className="flex justify-between text-xs font-semibold font-mono pb-1 border-b">
                <span>Saldo Inicial</span>
                <span
                  className={cn(
                    day.openingBalance < 0 && "text-destructive",
                  )}
                >
                  {monetary.formatMonetaryValue(day.openingBalance)}
                </span>
              </div>

              {/* Transactions */}
              {day.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm truncate">
                      {tx.note || tx.description || tx.category.name}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {STATUS_LABELS[tx.status] ?? tx.status}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "font-mono text-sm whitespace-nowrap shrink-0",
                      TYPE_COLORS[tx.type],
                    )}
                  >
                    {monetary.formatMonetaryValue(tx.amount)}
                  </span>
                </div>
              ))}

              {/* Closing */}
              <div className="flex justify-between text-xs font-semibold font-mono pt-1 border-t">
                <span>Saldo Final</span>
                <span
                  className={cn(
                    day.closingBalance < 0 && "text-destructive",
                  )}
                >
                  {monetary.formatMonetaryValue(day.closingBalance)}
                </span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

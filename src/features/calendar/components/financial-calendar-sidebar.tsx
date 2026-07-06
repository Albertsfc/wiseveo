"use client"

import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useMonetaryFormattingSafe } from "@/hooks/use-monetary-formatting"
import { cn } from "@/lib/utils"
import type { CalendarDayStatement } from "../types"

interface FinancialCalendarSidebarProps {
  currentDate: Date
  selectedDate: Date | null
  onSelectDate: (date: Date) => void
  days: CalendarDayStatement[]
  hasGoogle: boolean
  googleSlot?: React.ReactNode
}

export function FinancialCalendarSidebar({
  currentDate,
  selectedDate,
  onSelectDate,
  days,
  googleSlot,
}: FinancialCalendarSidebarProps) {
  const monetary = useMonetaryFormattingSafe()
  const totalIncome = days.reduce((s, d) => s + d.income, 0)
  const totalExpense = days.reduce((s, d) => s + d.expense, 0)
  const totalNet = days.reduce((s, d) => s + d.net, 0)
  const lastDay = days[days.length - 1]

  return (
    <div className="space-y-4">
      {/* Mini calendar */}
      <Calendar
        mode="single"
        selected={selectedDate ?? undefined}
        onSelect={(date) => date && onSelectDate(date)}
        defaultMonth={currentDate}
        className="rounded-md border"
      />

      {/* Month summary */}
      <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card">
        <CardHeader className="pb-2">
          <CardDescription>Resumo do Período</CardDescription>
          <CardTitle className="text-base">Visão Geral</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Entradas</span>
            <span className="font-mono text-chart-2">
              {monetary.formatMonetaryValue(totalIncome)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Saídas</span>
            <span className="font-mono text-destructive">
              {monetary.formatMonetaryValue(totalExpense)}
            </span>
          </div>
          <div className="flex justify-between text-sm border-t pt-2">
            <span className="font-medium">Líquido</span>
            <span
              className={cn(
                "font-mono font-semibold",
                totalNet < 0 ? "text-destructive" : "text-chart-2",
              )}
            >
              {monetary.formatMonetaryValue(totalNet)}
            </span>
          </div>
          {lastDay && (
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-muted-foreground">Saldo Final</span>
              <span
                className={cn(
                  "font-mono font-semibold",
                  lastDay.closingBalance < 0 && "text-destructive",
                )}
              >
                {monetary.formatMonetaryValue(lastDay.closingBalance)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Calendar slot */}
      {googleSlot && <div>{googleSlot}</div>}
    </div>
  )
}

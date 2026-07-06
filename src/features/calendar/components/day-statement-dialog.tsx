"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useMonetaryFormattingSafe } from "@/hooks/use-monetary-formatting"
import { cn } from "@/lib/utils"
import type { CalendarDayStatement } from "../types"

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  PENDING: "bg-chart-4/15 text-chart-4 border-chart-4/30",
  OVERDUE: "bg-destructive/15 text-destructive border-destructive/30",
  SCHEDULED: "bg-chart-1/15 text-chart-1 border-chart-1/30",
}

const STATUS_LABELS: Record<string, string> = {
  PAID: "Pago",
  PENDING: "Pendente",
  OVERDUE: "Vencido",
  SCHEDULED: "Agendado",
}

const TYPE_COLORS: Record<string, string> = {
  INCOME: "text-chart-2",
  EXPENSE: "text-destructive",
  TRANSFER: "text-chart-1",
}

interface DayStatementDialogProps {
  day: CalendarDayStatement | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSyncDay?: (date: string) => void
  hasGoogle?: boolean
}

export function DayStatementDialog({
  day,
  open,
  onOpenChange,
}: DayStatementDialogProps) {
  const monetary = useMonetaryFormattingSafe()

  if (!day) return null

  const dateObj = new Date(day.date + "T12:00:00Z")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="capitalize">
            {dateFmt.format(dateObj)}
          </DialogTitle>
          <DialogDescription>Extrato do dia</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Opening balance */}
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-semibold">
              Saldo Inicial
            </span>
            <span
              className={cn(
                "font-mono text-sm font-bold",
                day.openingBalance < 0 && "text-destructive",
              )}
            >
              {monetary.formatMonetaryValue(day.openingBalance)}
            </span>
          </div>

          {/* Transactions */}
          {day.transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma movimentação neste dia
            </p>
          ) : (
            <div className="space-y-2">
              {day.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-2 py-1.5 hover:bg-muted/50 rounded-md px-2 -mx-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {tx.note || tx.description || "—"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground truncate">
                        {tx.category.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {tx.account.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0",
                          STATUS_COLORS[tx.status],
                        )}
                      >
                        {STATUS_LABELS[tx.status] ?? tx.status}
                      </Badge>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "font-mono text-sm font-medium whitespace-nowrap shrink-0",
                      TYPE_COLORS[tx.type],
                    )}
                  >
                    {monetary.formatMonetaryValue(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Closing balance */}
          <div className="flex justify-between items-center py-2 border-t">
            <span className="text-sm font-semibold">Saldo Final</span>
            <span
              className={cn(
                "font-mono text-sm font-bold",
                day.closingBalance < 0 && "text-destructive",
              )}
            >
              {monetary.formatMonetaryValue(day.closingBalance)}
            </span>
          </div>

          {/* Summary */}
          {day.transactions.length > 0 && (
            <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center">
              <div>
                <p className="text-xs text-muted-foreground">Entradas</p>
                <p className="font-mono text-sm text-chart-2">
                  {monetary.formatMonetaryValue(day.income)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saídas</p>
                <p className="font-mono text-sm text-destructive">
                  {monetary.formatMonetaryValue(day.expense)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Líquido</p>
                <p
                  className={cn(
                    "font-mono text-sm",
                    day.net < 0 ? "text-destructive" : "text-chart-2",
                  )}
                >
                  {monetary.formatMonetaryValue(day.net)}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

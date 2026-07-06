"use client"

import type { ColumnDef, FilterFn, Row } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { formatPeriod } from "@/lib/financial"
import type { MonetaryFormatter } from "@/lib/monetary"
import { cn } from "@/lib/utils"

import type { SerializedTransaction, TransactionTableMeta } from "../types"
import { DataTableColumnHeader } from "./data-table-column-header"
import { TransactionActions } from "./transaction-actions"
import { StatusDot } from "../../shared/components/status-dot"

const statusConfig: Record<string, { label: string; className: string }> = {
  PAID: { label: "Pago", className: "bg-chart-2/15 text-chart-2 border-chart-2/30" },
  PENDING: { label: "Pendente", className: "bg-chart-4/15 text-chart-4 border-chart-4/30" },
  OVERDUE: { label: "Vencido", className: "bg-destructive/15 text-destructive border-destructive/30" },
  SCHEDULED: { label: "Agendado", className: "bg-chart-1/15 text-chart-1 border-chart-1/30" },
}

const typeConfig: Record<string, { label: string; className: string }> = {
  INCOME: { label: "Receita", className: "text-chart-2" },
  EXPENSE: { label: "Despesa", className: "text-destructive" },
  TRANSFER: { label: "Transferência", className: "text-muted-foreground" },
}

type TransactionColumnFormatter = Pick<
  MonetaryFormatter,
  "formatMonetaryValue" | "getSearchCandidates"
>

interface ParsedAmountQuery {
  hasSeparator: boolean
  intPart: string
  fractionPart: string
  trailingSeparator: boolean
}

function stripLeadingZeros(value: string): string {
  const normalized = value.replace(/^0+(?=\d)/, "")
  return normalized.length > 0 ? normalized : "0"
}

function parseAmountQuery(search: string): ParsedAmountQuery | null {
  const numericToken = search.match(/-?\d[\d.,]*/)
  if (!numericToken) return null

  const token = numericToken[0]
  const lastSeparatorIndex = Math.max(token.lastIndexOf(","), token.lastIndexOf("."))

  if (lastSeparatorIndex === -1) {
    return {
      hasSeparator: false,
      intPart: token.replace(/\D/g, ""),
      fractionPart: "",
      trailingSeparator: false,
    }
  }

  const intPart = token.slice(0, lastSeparatorIndex).replace(/\D/g, "")
  const fractionRaw = token.slice(lastSeparatorIndex + 1)

  return {
    hasSeparator: true,
    intPart,
    fractionPart: fractionRaw.replace(/\D/g, ""),
    trailingSeparator: fractionRaw.length === 0,
  }
}

function matchesAmountSearch(
  amount: number,
  search: string,
  monetary: TransactionColumnFormatter,
): boolean {
  const parsed = parseAmountQuery(search)
  if (!parsed) return false

  const absoluteAmount = Math.abs(amount)
  const [amountIntRaw, amountFraction] = absoluteAmount.toFixed(2).split(".")
  const amountInt = stripLeadingZeros(amountIntRaw)
  const amountDigits = `${amountInt}${amountFraction}`
  const textCandidates = monetary.getSearchCandidates(amount)

  if (parsed.hasSeparator) {
    const searchInt = stripLeadingZeros(parsed.intPart || "0")
    if (parsed.trailingSeparator || parsed.fractionPart.length === 0) {
      return amountInt === searchInt
    }

    if (amountInt !== searchInt) return false
    return amountFraction.startsWith(parsed.fractionPart)
  }

  if (textCandidates.some((value) => value.includes(search))) {
    return true
  }

  const searchDigits = stripLeadingZeros(parsed.intPart)
  return searchDigits.length > 0 && amountDigits.includes(searchDigits)
}

function getAmountColorClass(amount: number): string {
  if (amount < 0) return "text-destructive"
  if (amount > 0) return "text-chart-2"
  return "text-muted-foreground"
}

export function createTransactionGlobalFilter(
  monetary: TransactionColumnFormatter,
): FilterFn<SerializedTransaction> {
  return (row: Row<SerializedTransaction>, _columnId: string, filterValue: string) => {
    const search = filterValue.toLowerCase()

    const description = (row.getValue("description") as string)?.toLowerCase() || ""
    const note = (row.getValue("note") as string)?.toLowerCase() || ""
    const reference = (row.getValue("reference") as string)?.toLowerCase() || ""
    const payee = (row.getValue("payee") as string)?.toLowerCase() || ""
    const category = (row.original.category?.name as string)?.toLowerCase() || ""
    const group = (row.original.category?.group?.name as string)?.toLowerCase() || ""
    const account = (row.original.account?.name as string)?.toLowerCase() || ""
    const period = (row.getValue("period") as string)?.toLowerCase() || ""
    const formattedPeriod =
      period.length === 6 ? formatPeriod(period).toLowerCase() : ""

    const dateStr = row.getValue("date") as string
    const formattedDate = dateStr
      ? new Intl.DateTimeFormat("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(dateStr))
      : ""

    const status = row.getValue("status") as string
    const translatedStatus = statusConfig[status]?.label.toLowerCase() || ""

    const type = row.original.type as string
    const translatedType = typeConfig[type]?.label.toLowerCase() || ""

    const amount = row.getValue("amount") as number
    const amountMatches = matchesAmountSearch(amount, search, monetary)

    return (
      description.includes(search) ||
      note.includes(search) ||
      reference.includes(search) ||
      payee.includes(search) ||
      category.includes(search) ||
      group.includes(search) ||
      account.includes(search) ||
      period.includes(search) ||
      formattedPeriod.includes(search) ||
      formattedDate.includes(search) ||
      translatedStatus.includes(search) ||
      translatedType.includes(search) ||
      amountMatches
    )
  }
}

const statusSortWeights: Record<string, number> = {
  SCHEDULED: 1,
  PENDING: 2,
  OVERDUE: 3,
  PAID: 4,
}

export const statusSortFn = (
  rowA: Row<SerializedTransaction>,
  rowB: Row<SerializedTransaction>,
  columnId: string,
) => {
  const statusA = rowA.getValue(columnId) as string
  const statusB = rowB.getValue(columnId) as string

  const weightA = statusSortWeights[statusA] || 99
  const weightB = statusSortWeights[statusB] || 99

  if (weightA === weightB) return 0
  return weightA > weightB ? 1 : -1
}

export function getTransactionColumns(
  monetary: TransactionColumnFormatter,
  isMobile: boolean = false,
): ColumnDef<SerializedTransaction>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Selecionar tudo"
          className="translate-y-[2px] cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Selecionar linha"
          className="translate-y-[2px] cursor-pointer"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "num",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="NUM" />
      ),
      cell: ({ row }) => {
        const num = row.getValue("num") as number | null
        return <div className="w-[70px] text-sm">{num ?? "—"}</div>
      },
      meta: { responsive: "hide-mobile" },
    },
    {
      accessorKey: "period",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="PERÍODO" />
      ),
      cell: ({ row }) => {
        const period = (row.getValue("period") as string | null) ?? ""
        const formatted = period.length === 6 ? formatPeriod(period) : "—"
        return <div className="w-[80px] text-sm tabular-nums">{formatted}</div>
      },
      meta: { responsive: "hide-mobile" },
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="DATA" />
      ),
      cell: ({ row }) => {
        const dateStr = row.getValue("date") as string
        const formattedDate = new Intl.DateTimeFormat("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: isMobile ? undefined : "numeric",
          timeZone: "UTC",
        }).format(new Date(dateStr))

        return (
          <div className="w-[60px] md:w-[90px] text-sm">
            {formattedDate}
          </div>
        )
      },
    },
    {
      accessorKey: "reference",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="REF" />
      ),
      cell: ({ row }) => (
        <div className="max-w-[140px] truncate text-sm">
          {row.getValue("reference") || "—"}
        </div>
      ),
      meta: { responsive: "hide-mobile" },
    },
    {
      accessorKey: "note",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="HISTÓRICO" />
      ),
      cell: ({ row }) => (
        <div className="max-w-[220px] truncate text-sm">
          {row.getValue("note") || "—"}
        </div>
      ),
      meta: { responsive: "hide-mobile" },
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="DESCRIÇÃO" />
      ),
      cell: ({ row }) => (
        <div className="max-w-[260px] truncate text-sm">
          {row.getValue("description") || "—"}
        </div>
      ),
    },
    {
      id: "group",
      accessorFn: (row) => row.category.group.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="GRUPO" />
      ),
      cell: ({ row }) => (
        <div className="max-w-[160px] truncate text-sm">{row.original.category.group.name}</div>
      ),
      meta: { responsive: "hide-mobile" },
    },
    {
      id: "category",
      accessorFn: (row) => row.category.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="CATEGORIA" />
      ),
      cell: ({ row }) => (
        <div className="max-w-[180px] truncate text-sm">{row.original.category.name}</div>
      ),
      filterFn: (row, _id, value) => {
        return value.includes(row.original.category.name)
      },
      meta: { responsive: "hide-mobile" },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="VALOR" />
      ),
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number
        return (
          <div className={cn("font-mono text-sm font-medium text-right", getAmountColorClass(amount))}>
            {monetary.formatMonetaryValue(amount)}
          </div>
        )
      },
    },
    {
      id: "account",
      accessorFn: (row) => row.account.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="BANCO" />
      ),
      cell: ({ row }) => (
        <div className="text-sm">{row.original.account.name}</div>
      ),
      filterFn: (row, _id, value) => {
        return value.includes(row.original.account.name)
      },
      meta: { responsive: "hide-mobile" },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="STATUS" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const config = statusConfig[status]
        if (!config) return null
        return (
          <div className="flex items-center justify-center md:justify-start">
            <div className="hidden md:block">
              <Badge variant="outline" className={cn("text-xs", config.className)}>
                {config.label}
              </Badge>
            </div>
            <div className="block md:hidden">
              <StatusDot status={status as any} />
            </div>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
      sortingFn: statusSortFn,
    },
    {
      id: "type",
      accessorFn: (row) => row.type,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="TIPO" />
      ),
      cell: ({ row }) => {
        const type = row.original.type
        const config = typeConfig[type]
        return <div className={cn("text-sm", config.className)}>{config.label}</div>
      },
      filterFn: (row, _id, value) => {
        return value.includes(row.original.type)
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">AÇÕES</div>,
      cell: ({ row, table }) => {
        const meta = table.options.meta as TransactionTableMeta | undefined

        return (
          <div className="flex justify-end">
            <TransactionActions
              transaction={row.original}
              onQuickPay={(tx) => meta?.onQuickPayTransaction?.(tx)}
              onEdit={(tx) => meta?.onEditTransaction?.(tx)}
              onCopy={(tx) => meta?.onCopyTransaction?.(tx)}
              onMakeRecurring={(tx) => meta?.onMakeRecurring?.(tx)}
              onAttachments={(tx) => meta?.onOpenAttachments?.(tx)}
              onNotes={(tx) => meta?.onOpenNotes?.(tx)}
              onDelete={(tx) => meta?.onDeleteTransaction?.(tx)}
            />
          </div>
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "payee",
      accessorFn: (row) => row.payee?.name ?? "",
      header: ({ column }) => <DataTableColumnHeader column={column} title="BENEFICIÁRIO" />,
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.payee?.name || "—"}
        </div>
      ),
    },
  ]
}

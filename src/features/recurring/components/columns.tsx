"use client"

import type { ColumnDef, Row } from "@tanstack/react-table"
import { format, parseISO } from "date-fns"

import { Checkbox } from "@/components/ui/checkbox"
import { formatPeriod } from "@/lib/financial"
import type { MonetaryFormatter } from "@/lib/monetary"
import { cn } from "@/lib/utils"

import type { SerializedRecurringTransaction, RecurringTableMeta } from "../types"
import { DataTableColumnHeader } from "../../transactions/components/data-table-column-header"
import { RecurringActions } from "./recurring-actions"

const typeConfig: Record<string, { label: string; className: string }> = {
  INCOME: { label: "Receita", className: "text-chart-2" },
  EXPENSE: { label: "Despesa", className: "text-destructive" },
  TRANSFER: { label: "Transferência", className: "text-muted-foreground" },
}

type RecurringColumnFormatter = Pick<
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
  monetary: RecurringColumnFormatter,
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

export function createRecurringFilter(monetary: RecurringColumnFormatter) {
  return (
    row: Row<SerializedRecurringTransaction>,
    _columnId: string,
    filterValue: string,
  ) => {
    const search = filterValue.toLowerCase().trim()
    if (!search) return true

    const note = (row.getValue("note") as string)?.toLowerCase() || ""
    const description = (row.getValue("description") as string)?.toLowerCase() || ""
    const reference = (row.original.reference || "").toLowerCase()
    const period = row.original.period.toLowerCase()
    const formattedPeriod =
      row.original.period.length === 6
        ? formatPeriod(row.original.period).toLowerCase()
        : ""
    const group = (row.original.category.group.name || "").toLowerCase()
    const category = (row.original.category.name || "").toLowerCase()
    const account = (row.original.account.name || "").toLowerCase()
    const status = (row.original.status.name || "").toLowerCase()
    const translatedType = typeConfig[row.original.type]?.label.toLowerCase() || ""

    const lastDate = row.getValue("lastDate") as string | null
    const formattedDate = lastDate
      ? format(parseISO(lastDate), "dd/MM/yyyy").toLowerCase()
      : ""

    const amountMatches = matchesAmountSearch(row.original.amount, search, monetary)

    return (
      note.includes(search) ||
      description.includes(search) ||
      reference.includes(search) ||
      period.includes(search) ||
      formattedPeriod.includes(search) ||
      group.includes(search) ||
      category.includes(search) ||
      account.includes(search) ||
      status.includes(search) ||
      translatedType.includes(search) ||
      formattedDate.includes(search) ||
      amountMatches
    )
  }
}

export function getRecurringColumns(
  monetary: RecurringColumnFormatter,
): ColumnDef<SerializedRecurringTransaction>[] {
  const recurringFilter = createRecurringFilter(monetary)

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
      accessorKey: "lastDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ÚLT. LANÇAMENTO" />
      ),
      cell: ({ row }) => {
        const dateStr = row.getValue("lastDate") as string | null
        return (
          <div className="w-[110px] text-sm">
            {dateStr ? format(parseISO(dateStr), "dd/MM/yyyy") : "—"}
          </div>
        )
      },
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
      filterFn: recurringFilter,
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
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="VALOR" />
      ),
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number
        const type = row.original.type
        const colorClass =
          type === "INCOME"
            ? "text-chart-2"
            : type === "EXPENSE"
              ? "text-destructive"
              : "text-muted-foreground"
        return (
          <div className={cn("font-mono text-sm font-medium text-right", colorClass)}>
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
    },
    {
      id: "actions",
      header: () => <div className="text-right">AÇÕES</div>,
      cell: ({ row, table }) => {
        const meta = table.options.meta as RecurringTableMeta | undefined
        return (
          <div className="flex justify-end">
            <RecurringActions
              recurring={row.original}
              onLaunch={(recurring) => meta?.onLaunchRecurring?.(recurring)}
              onEdit={(recurring) => meta?.onEditRecurring?.(recurring)}
              onDelete={(recurring) => meta?.onDeleteRecurring?.(recurring)}
            />
          </div>
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
  ]
}

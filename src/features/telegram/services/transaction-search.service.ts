import { getTransactions } from "@/features/transactions/services/get-transactions"
import type { SerializedTransaction } from "@/features/transactions/types"
import { endOfUTCDay, startOfUTCDay } from "@/lib/financial"
import {
  clampToolLimit,
  formatMoney,
  includesSearch,
  normalizeSearch,
  startOfCurrentMonthUtc,
  endOfCurrentMonthUtc,
} from "../tools/tool-utils"

type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER"
type TransactionStatus = "PAID" | "PENDING" | "OVERDUE" | "SCHEDULED"

export interface TransactionSearchInput {
  userId: string
  period?: { from: string; to: string }
  searchText?: string
  transactionType?: TransactionType
  status?: TransactionStatus
  accountName?: string
  groupName?: string
  categoryName?: string
  limit?: number
}

export interface TransactionSearchItem {
  id: string
  period: string
  date: string
  formattedDate: string
  reference: string | null
  note: string | null
  description: string | null
  groupName: string
  categoryName: string
  formattedAmount: string
  accountName: string
  status: TransactionStatus
  statusLabel: string
  matchedColumns: string[]
}

export interface TransactionSearchResult {
  period: { from: string; to: string; label: string }
  filters: {
    searchText?: string
    transactionType?: TransactionType
    status?: TransactionStatus
    accountName?: string
    groupName?: string
    categoryName?: string
  }
  totalCount: number
  shownCount: number
  total: number
  formattedTotal: string
  items: TransactionSearchItem[]
  aggregates: {
    byCategory: Array<{ name: string; count: number; total: number; formattedTotal: string }>
    byAccount: Array<{ name: string; count: number; total: number; formattedTotal: string }>
    byStatus: Array<{ name: string; count: number; total: number; formattedTotal: string }>
  }
  noMatchesMessage?: string
}

const STATUS_LABELS: Record<TransactionStatus, string> = {
  PAID: "Pago",
  PENDING: "Pendente",
  OVERDUE: "Vencido",
  SCHEDULED: "Agendado",
}

function resolveRange(period: TransactionSearchInput["period"]) {
  const from = period?.from ? startOfUTCDay(new Date(period.from)) : startOfCurrentMonthUtc()
  const to = period?.to ? endOfUTCDay(new Date(period.to)) : endOfCurrentMonthUtc()
  return from > to ? { from: to, to: from } : { from, to }
}

function formatDatePtBr(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value))
}

function formatPeriodLabel(from: Date, to: Date) {
  const sameMonth =
    from.getUTCFullYear() === to.getUTCFullYear() && from.getUTCMonth() === to.getUTCMonth()

  if (sameMonth) {
    const month = new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      timeZone: "UTC",
    }).format(from)
    return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${from.getUTCFullYear()}`
  }

  return `${formatDatePtBr(from.toISOString())} a ${formatDatePtBr(to.toISOString())}`
}

function searchableColumns(transaction: SerializedTransaction) {
  const formattedDate = formatDatePtBr(transaction.date)
  const formattedAmount = formatMoney(transaction.amount)
  const statusLabel = STATUS_LABELS[transaction.status]

  return [
    { name: "PERÍODO", value: transaction.period },
    { name: "DATA", value: transaction.date.slice(0, 10) },
    { name: "DATA", value: formattedDate },
    { name: "REF", value: transaction.reference },
    { name: "HISTÓRICO", value: transaction.note },
    { name: "DESCRIÇÃO", value: transaction.description },
    { name: "GRUPO", value: transaction.category.group.name },
    { name: "CATEGORIA", value: transaction.category.name },
    { name: "VALOR", value: formattedAmount },
    { name: "VALOR", value: String(transaction.amount) },
    { name: "BANCO", value: transaction.account.name },
    { name: "STATUS", value: transaction.status },
    { name: "STATUS", value: statusLabel },
  ]
}

function normalizeLightLiteralSearch(value: string | null | undefined): string {
  return normalizeSearch(value)
    .replace(/([a-z])\1+/g, "$1")
    .replace(/\s+/g, " ")
}

export function includesLiteralSearch(value: string | null | undefined, search: string | undefined): boolean {
  const normalizedSearch = normalizeSearch(search)
  if (!normalizedSearch) return true
  if (includesSearch(value, search)) return true

  const lightSearch = normalizeLightLiteralSearch(search)
  return Boolean(lightSearch) && normalizeLightLiteralSearch(value).includes(lightSearch)
}

function matchesLiteralSearch(transaction: SerializedTransaction, searchText: string | undefined) {
  const term = searchText?.trim()
  if (!term) return true
  return searchableColumns(transaction).some((column) => includesLiteralSearch(column.value, term))
}

function matchedColumns(transaction: SerializedTransaction, searchText: string | undefined) {
  const term = searchText?.trim()
  if (!term) return []

  return Array.from(
    new Set(
      searchableColumns(transaction)
        .filter((column) => includesLiteralSearch(column.value, term))
        .map((column) => column.name),
    ),
  )
}

function buildAggregate(
  transactions: SerializedTransaction[],
  getName: (transaction: SerializedTransaction) => string,
) {
  const groups = new Map<string, { count: number; total: number }>()

  for (const transaction of transactions) {
    const name = getName(transaction)
    const existing = groups.get(name) ?? { count: 0, total: 0 }
    groups.set(name, {
      count: existing.count + 1,
      total: existing.total + transaction.amount,
    })
  }

  return Array.from(groups.entries())
    .sort((a, b) => Math.abs(b[1].total) - Math.abs(a[1].total))
    .slice(0, 5)
    .map(([name, value]) => ({
      name,
      count: value.count,
      total: value.total,
      formattedTotal: formatMoney(value.total),
    }))
}

function buildNoMatchesMessage(input: {
  searchText?: string
  periodLabel: string
  hasStructuredFilters: boolean
}) {
  const term = input.searchText?.trim()
  if (term) {
    return `Não encontrei lançamentos contendo "${term}" em ${input.periodLabel}.`
  }

  if (input.hasStructuredFilters) {
    return `Não encontrei lançamentos com esses filtros em ${input.periodLabel}.`
  }

  return `Não encontrei lançamentos em ${input.periodLabel}.`
}

export async function searchTransactions(input: TransactionSearchInput): Promise<TransactionSearchResult> {
  const { from, to } = resolveRange(input.period)
  const { transactions } = await getTransactions({ userId: input.userId, from, to })
  const take = clampToolLimit(input.limit, 10)

  const allFiltered = transactions
    .filter((transaction) => !input.transactionType || transaction.type === input.transactionType)
    .filter((transaction) => !input.status || transaction.status === input.status)
    .filter((transaction) => includesSearch(transaction.account.name, input.accountName))
    .filter((transaction) => includesSearch(transaction.category.group.name, input.groupName))
    .filter((transaction) => includesSearch(transaction.category.name, input.categoryName))
    .filter((transaction) => matchesLiteralSearch(transaction, input.searchText))

  const total = allFiltered.reduce((sum, transaction) => sum + transaction.amount, 0)
  const items = allFiltered.slice(0, take)
  const periodLabel = formatPeriodLabel(from, to)
  const hasStructuredFilters = Boolean(
    input.transactionType || input.status || input.accountName || input.groupName || input.categoryName,
  )

  return {
    period: {
      from: from.toISOString(),
      to: to.toISOString(),
      label: periodLabel,
    },
    filters: {
      searchText: input.searchText?.trim() || undefined,
      transactionType: input.transactionType,
      status: input.status,
      accountName: input.accountName,
      groupName: input.groupName,
      categoryName: input.categoryName,
    },
    totalCount: allFiltered.length,
    shownCount: items.length,
    total,
    formattedTotal: formatMoney(total),
    items: items.map((transaction) => ({
      id: transaction.id,
      period: transaction.period,
      date: transaction.date,
      formattedDate: formatDatePtBr(transaction.date),
      reference: transaction.reference,
      note: transaction.note,
      description: transaction.description,
      groupName: transaction.category.group.name,
      categoryName: transaction.category.name,
      formattedAmount: formatMoney(transaction.amount),
      accountName: transaction.account.name,
      status: transaction.status,
      statusLabel: STATUS_LABELS[transaction.status],
      matchedColumns: matchedColumns(transaction, input.searchText),
    })),
    aggregates: {
      byCategory: buildAggregate(allFiltered, (transaction) => transaction.category.name),
      byAccount: buildAggregate(allFiltered, (transaction) => transaction.account.name),
      byStatus: buildAggregate(allFiltered, (transaction) => STATUS_LABELS[transaction.status]),
    },
    noMatchesMessage:
      allFiltered.length === 0
        ? buildNoMatchesMessage({
            searchText: input.searchText,
            periodLabel,
            hasStructuredFilters,
          })
        : undefined,
  }
}

"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { format, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { usePathname } from "next/navigation"
import { toast } from "sonner"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useDateRange } from "@/contexts/date-range-context"
import { useMonetaryFormattingSafe } from "@/hooks/use-monetary-formatting"
import type { AccountWithBalance } from "@/features/accounts/types"
import type { FinancialSummary } from "@/features/shared/services/get-financial-summary"

import type {
  SerializedTransaction,
  TransactionFilterOptions,
  TransactionFormOptions,
} from "../types"
import { useTransactionForm } from "../hooks/use-transaction-form"
import { createTransactionGlobalFilter, getTransactionColumns } from "./columns"
import { useDeviceClass } from "@/hooks/use-device-class"
import { DataTable } from "./data-table"
import { NewTransactionDialog } from "./new-transaction-dialog"
import { BalanceSummaryCards } from "./balance-summary-cards"
import {
  DeleteConfirmDialog,
  QuickPayConfirmDialog,
  MakeRecurringConfirmDialog,
} from "./confirm-dialogs"
import { AttachmentDialog } from "./attachment-dialog"
import { TransactionMessagesDialog } from "./transaction-messages-dialog"

interface TransactionsClientProps {
  initialTransactions: SerializedTransaction[]
  initialFilterOptions: TransactionFilterOptions
  formOptions: TransactionFormOptions
  initialBalancesAtDate: AccountWithBalance[]
  initialBalancesAtEndOfMonth: AccountWithBalance[]
  initialSummary: FinancialSummary
}

export function TransactionsClient({
  initialTransactions,
  initialFilterOptions,
  formOptions,
  initialBalancesAtDate,
  initialBalancesAtEndOfMonth,
  initialSummary,
}: TransactionsClientProps) {
  const monetary = useMonetaryFormattingSafe()
  const { dateRange, setDateRange } = useDateRange()
  const pathname = usePathname()
  const [transactions, setTransactions] = useState(initialTransactions)
  const [filterOptions, setFilterOptions] = useState(initialFilterOptions)
  const [balancesAtDate, setBalancesAtDate] = useState(initialBalancesAtDate)
  const [balancesAtEndOfMonth, setBalancesAtEndOfMonth] = useState(
    initialBalancesAtEndOfMonth,
  )
  const [summary, setSummary] = useState(initialSummary)
  const [loading, setLoading] = useState(false)
  const latestRequestRef = useRef(0)

  const fetchTransactions = useCallback(async (from: Date, to: Date) => {
    const requestId = ++latestRequestRef.current
    setLoading(true)
    try {
      const params = new URLSearchParams({
        from: format(from, "yyyy-MM-dd"),
        to: format(to, "yyyy-MM-dd"),
      })
      const res = await fetch(`/api/transactions?${params}`, { cache: "no-store" })
      if (!res.ok) throw new Error("Erro ao buscar transações")
      const data = await res.json()
      if (requestId !== latestRequestRef.current) return
      setTransactions(data.transactions)
      setFilterOptions(data.filterOptions)
      setBalancesAtDate(data.balancesAtDate)
      setBalancesAtEndOfMonth(data.balancesAtEndOfMonth)
      setSummary(data.summary)
    } catch (error) {
      if (requestId !== latestRequestRef.current) return
      console.error("Failed to fetch transactions:", error)
      toast.error("Erro ao sincronizar transações com o período selecionado")
    } finally {
      if (requestId !== latestRequestRef.current) return
      setLoading(false)
    }
  }, [])

  const form = useTransactionForm({
    formOptions,
    onSuccess: () => fetchTransactions(dateRange.from, dateRange.to),
  })

  // --- Action states ---
  const [txToDelete, setTxToDelete] = useState<SerializedTransaction | null>(null)
  const [txToPay, setTxToPay] = useState<SerializedTransaction | null>(null)
  const [txToRecur, setTxToRecur] = useState<SerializedTransaction | null>(null)
  const [txForAttachments, setTxForAttachments] = useState<SerializedTransaction | null>(null)
  const [txForMessages, setTxForMessages] = useState<SerializedTransaction | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [batchLoading, setBatchLoading] = useState(false)

  const refetch = useCallback(
    () => fetchTransactions(dateRange.from, dateRange.to),
    [dateRange.from, dateRange.to, fetchTransactions]
  )

  const handleDeleteConfirm = useCallback(async () => {
    if (!txToDelete) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/transactions/${txToDelete.id}/exclude`, {
        method: "POST",
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Erro ao excluir transação")
        return
      }
      toast.success("Lançamento excluído com sucesso")
      setTxToDelete(null)
      refetch()
    } catch {
      toast.error("Erro ao excluir transação")
    } finally {
      setActionLoading(false)
    }
  }, [txToDelete, refetch])

  const handleQuickPayConfirm = useCallback(async () => {
    if (!txToPay) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/transactions/${txToPay.id}/quick-pay`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Erro ao efetuar pagamento rápido")
        return
      }
      toast.success("Pagamento rápido efetuado com sucesso")
      setTxToPay(null)
      refetch()
    } catch {
      toast.error("Erro ao efetuar pagamento rápido")
    } finally {
      setActionLoading(false)
    }
  }, [txToPay, refetch])

  const handleMakeRecurringConfirm = useCallback(async () => {
    if (!txToRecur) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/transactions/${txToRecur.id}/recurrent`, {
        method: "POST",
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Erro ao criar transação recorrente")
        return
      }
      toast.success("Transação recorrente criada com sucesso")
      setTxToRecur(null)
    } catch {
      toast.error("Erro ao criar transação recorrente")
    } finally {
      setActionLoading(false)
    }
  }, [txToRecur])

  const handleEditTransaction = useCallback((tx: SerializedTransaction) => {
    try {
      form.openEditDialog(tx)
      toast.success("Edição de lançamento aberta")
    } catch {
      toast.error("Erro ao abrir edição do lançamento")
    }
  }, [form])

  const handleCopyTransaction = useCallback((tx: SerializedTransaction) => {
    try {
      form.openCopyDialog(tx)
      toast.success("Cópia de lançamento aberta")
    } catch {
      toast.error("Erro ao abrir cópia do lançamento")
    }
  }, [form])

  const handleOpenAttachments = useCallback((tx: SerializedTransaction) => {
    try {
      setTxForAttachments(tx)
      toast.success("Gerenciador de anexos aberto")
    } catch {
      toast.error("Erro ao abrir anexos do lançamento")
    }
  }, [])

  const handleNotes = useCallback((tx: SerializedTransaction) => {
    setTxForMessages(tx)
  }, [])

  const handleMessageCountChange = useCallback((transactionId: string, count: number) => {
    setTransactions((prev) => prev.map((tx) => {
      if (tx.id !== transactionId) return tx
      if (tx.messageCount === count) return tx
      return { ...tx, messageCount: count }
    }))

    setTxForMessages((prev) => {
      if (!prev || prev.id !== transactionId) return prev
      if (prev.messageCount === count) return prev
      return { ...prev, messageCount: count }
    })
  }, [])

  const handleBatchQuickPay = useCallback(async (
    items: SerializedTransaction[]
  ): Promise<boolean> => {
    if (items.length === 0) return true

    setBatchLoading(true)
    try {
      let succeeded = 0
      let failed = 0

      for (const transaction of items) {
        try {
          const response = await fetch(`/api/transactions/${transaction.id}/quick-pay`, {
            method: "POST",
          })
          if (!response.ok) {
            failed += 1
            continue
          }
          succeeded += 1
        } catch {
          failed += 1
        }
      }

      if (failed === 0) {
        toast.success(
          `${succeeded} lançamento${succeeded > 1 ? "s atualizados" : " atualizado"} com pagamento rápido`
        )
      } else if (succeeded > 0) {
        toast.warning(`${succeeded} processado(s) e ${failed} com falha`)
      } else {
        toast.error("Falha ao aplicar pagamento rápido nos lançamentos selecionados")
      }

      await refetch()
      return true
    } finally {
      setBatchLoading(false)
    }
  }, [refetch])

  const handleBatchEditDate = useCallback(async (
    items: SerializedTransaction[],
    date: string
  ): Promise<boolean> => {
    if (items.length === 0) return true

    setBatchLoading(true)
    try {
      let succeeded = 0
      let failed = 0

      for (const transaction of items) {
        try {
          const response = await fetch(`/api/transactions/${transaction.id}/date`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date }),
          })
          if (!response.ok) {
            failed += 1
            continue
          }
          succeeded += 1
        } catch {
          failed += 1
        }
      }

      if (failed === 0) {
        toast.success(
          `Data atualizada em ${succeeded} lançamento${succeeded > 1 ? "s" : ""}`
        )
      } else if (succeeded > 0) {
        toast.warning(`${succeeded} atualizado(s) e ${failed} com falha`)
      } else {
        toast.error("Falha ao atualizar data dos lançamentos selecionados")
      }

      await refetch()
      return true
    } finally {
      setBatchLoading(false)
    }
  }, [refetch])

  const handleBatchEditPeriod = useCallback(async (
    items: SerializedTransaction[],
    period: string
  ): Promise<boolean> => {
    if (items.length === 0) return true

    setBatchLoading(true)
    try {
      let succeeded = 0
      let failed = 0

      for (const transaction of items) {
        try {
          const response = await fetch(`/api/transactions/${transaction.id}/period`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ period }),
          })
          if (!response.ok) {
            failed += 1
            continue
          }
          succeeded += 1
        } catch {
          failed += 1
        }
      }

      if (failed === 0) {
        toast.success(
          `Período atualizado em ${succeeded} lançamento${succeeded > 1 ? "s" : ""}`
        )
      } else if (succeeded > 0) {
        toast.warning(`${succeeded} atualizado(s) e ${failed} com falha`)
      } else {
        toast.error("Falha ao atualizar período dos lançamentos selecionados")
      }

      await refetch()
      return true
    } finally {
      setBatchLoading(false)
    }
  }, [refetch])

  const handleBatchCopyTransactions = useCallback(async (
    items: SerializedTransaction[],
    date: string
  ): Promise<boolean> => {
    if (items.length === 0) return true

    setBatchLoading(true)
    try {
      let succeeded = 0
      let failed = 0

      for (const transaction of items) {
        try {
          const response = await fetch(`/api/transactions/${transaction.id}/copy`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date }),
          })
          if (!response.ok) {
            failed += 1
            continue
          }
          succeeded += 1
        } catch {
          failed += 1
        }
      }

      if (failed === 0) {
        toast.success(
          `${succeeded} lançamento${succeeded > 1 ? "s" : ""} copiado${succeeded > 1 ? "s" : ""}`
        )
      } else if (succeeded > 0) {
        toast.warning(`${succeeded} copiado(s) e ${failed} com falha`)
      } else {
        toast.error("Falha ao copiar os lançamentos selecionados")
      }

      await refetch()
      return true
    } finally {
      setBatchLoading(false)
    }
  }, [refetch])

  const handleBatchMakeRecurring = useCallback(async (
    items: SerializedTransaction[]
  ): Promise<boolean> => {
    if (items.length === 0) return true

    setBatchLoading(true)
    try {
      let succeeded = 0
      let failed = 0

      for (const transaction of items) {
        try {
          const response = await fetch(`/api/transactions/${transaction.id}/recurrent`, {
            method: "POST",
          })
          if (!response.ok) {
            failed += 1
            continue
          }
          succeeded += 1
        } catch {
          failed += 1
        }
      }

      if (failed === 0) {
        toast.success(
          `${succeeded} recorrência${succeeded > 1 ? "s criadas" : " criada"} com sucesso`
        )
      } else if (succeeded > 0) {
        toast.warning(`${succeeded} criada(s) e ${failed} com falha`)
      } else {
        toast.error("Falha ao criar recorrências dos lançamentos selecionados")
      }

      return true
    } finally {
      setBatchLoading(false)
    }
  }, [])

  const handleBatchNotes = useCallback(async (
    items: SerializedTransaction[]
  ): Promise<boolean> => {
    if (items.length === 0) return true
    toast.error("Observações/Mensagens em desenvolvimento")
    return true
  }, [])

  const handleBatchDelete = useCallback(async (
    items: SerializedTransaction[]
  ): Promise<boolean> => {
    if (items.length === 0) return true

    setBatchLoading(true)
    try {
      let succeeded = 0
      let failed = 0

      for (const transaction of items) {
        try {
          const response = await fetch(`/api/transactions/${transaction.id}/exclude`, {
            method: "POST",
          })
          if (!response.ok) {
            failed += 1
            continue
          }
          succeeded += 1
        } catch {
          failed += 1
        }
      }

      if (failed === 0) {
        toast.success(
          `${succeeded} lançamento${succeeded > 1 ? "s excluídos" : " excluído"} com sucesso`
        )
      } else if (succeeded > 0) {
        toast.warning(`${succeeded} excluído(s) e ${failed} com falha`)
      } else {
        toast.error("Falha ao excluir lançamentos selecionados")
      }

      await refetch()
      return true
    } finally {
      setBatchLoading(false)
    }
  }, [refetch])

  useEffect(() => {
    if (pathname !== "/transactions") return
    fetchTransactions(dateRange.from, dateRange.to)
  }, [pathname, dateRange.from, dateRange.to, fetchTransactions])

  const handleAddTransaction = useCallback(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const from = new Date(dateRange.from)
    from.setHours(0, 0, 0, 0)

    const to = new Date(dateRange.to)
    to.setHours(23, 59, 59, 999)

    let defaultDateStr: string | undefined = undefined

    if (today < from || today > to) {
      defaultDateStr = format(dateRange.from, "yyyy-MM-dd")
    }

    form.openDialog(defaultDateStr)
  }, [dateRange, form])

  const dateLabel = useMemo(
    () => format(dateRange.to, "d 'de' MMM.", { locale: ptBR }),
    [dateRange.to],
  )

  const endOfMonthLabel = useMemo(
    () => format(endOfMonth(dateRange.to), "d 'de' MMM.", { locale: ptBR }),
    [dateRange.to],
  )

  const sortingScopeKey = useMemo(
    () => `${format(dateRange.from, "yyyy-MM-dd")}|${format(dateRange.to, "yyyy-MM-dd")}`,
    [dateRange.from, dateRange.to],
  )

  const { isMobile } = useDeviceClass()
  const columns = useMemo(() => getTransactionColumns(monetary, isMobile), [monetary, isMobile])
  const globalFilterFn = useMemo(
    () => createTransactionGlobalFilter(monetary),
    [monetary],
  )

  return (
    <>

      {/* Balance & Summary Cards */}
      <div className="px-4 lg:px-6">
        <BalanceSummaryCards
          balancesAtDate={balancesAtDate}
          balancesAtEndOfMonth={balancesAtEndOfMonth}
          summary={summary}
          dateLabel={dateLabel}
          endOfMonthLabel={endOfMonthLabel}
        />
      </div>

      {/* Data Table */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Registro de Transações</CardTitle>
            <CardDescription>
              {transactions.length} transação{transactions.length !== 1 && "ões"}{" "}
              encontrada{transactions.length !== 1 && "s"} no período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={transactions}
              filterOptions={filterOptions}
              monetary={monetary}
              loading={loading}
              onAddTransaction={handleAddTransaction}
              onEditTransaction={handleEditTransaction}
              onCopyTransaction={handleCopyTransaction}
              onDeleteTransaction={setTxToDelete}
              onQuickPayTransaction={setTxToPay}
              onMakeRecurring={setTxToRecur}
              onOpenAttachments={handleOpenAttachments}
              onOpenNotes={handleNotes}
              onQuickPaySelectedTransactions={handleBatchQuickPay}
              onEditSelectedTransactionDate={handleBatchEditDate}
              onEditSelectedTransactionPeriod={handleBatchEditPeriod}
              onCopySelectedTransactions={handleBatchCopyTransactions}
              onMakeRecurringSelectedTransactions={handleBatchMakeRecurring}
              onNotesSelectedTransactions={handleBatchNotes}
              onDeleteSelectedTransactions={handleBatchDelete}
              batchLoading={batchLoading}
              globalFilterFn={globalFilterFn}
              sortingScopeKey={sortingScopeKey}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </CardContent>
        </Card>
      </div>

      <NewTransactionDialog {...form} formOptions={formOptions} />

      {/* Action Dialogs */}
      <DeleteConfirmDialog
        transaction={txToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setTxToDelete(null)}
        loading={actionLoading}
      />
      <QuickPayConfirmDialog
        transaction={txToPay}
        onConfirm={handleQuickPayConfirm}
        onCancel={() => setTxToPay(null)}
        loading={actionLoading}
      />
      <MakeRecurringConfirmDialog
        transaction={txToRecur}
        onConfirm={handleMakeRecurringConfirm}
        onCancel={() => setTxToRecur(null)}
        loading={actionLoading}
      />
      <AttachmentDialog
        transaction={txForAttachments}
        onClose={() => setTxForAttachments(null)}
      />
      <TransactionMessagesDialog
        transaction={txForMessages}
        onClose={() => setTxForMessages(null)}
        onMessageCountChange={handleMessageCountChange}
      />
    </>
  )
}

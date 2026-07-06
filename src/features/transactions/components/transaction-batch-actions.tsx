"use client"

import * as React from "react"
import {
  CalendarClock,
  CheckCircle,
  Copy,
  MessageSquare,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TransactionBatchActionsProps<TData> {
  selectedData: TData[]
  selectedCount: number
  batchLoading?: boolean
  onQuickPaySelectedTransactions?: (items: TData[]) => Promise<boolean>
  onEditSelectedTransactionDate?: (items: TData[], date: string) => Promise<boolean>
  onEditSelectedTransactionPeriod?: (items: TData[], period: string) => Promise<boolean>
  onCopySelectedTransactions?: (items: TData[], date: string) => Promise<boolean>
  onMakeRecurringSelectedTransactions?: (items: TData[]) => Promise<boolean>
  onNotesSelectedTransactions?: (items: TData[]) => Promise<boolean>
  onDeleteSelectedTransactions?: (items: TData[]) => Promise<boolean>
  onClearSelection: () => void
}

export function TransactionBatchActions<TData>({
  selectedData,
  selectedCount,
  batchLoading,
  onQuickPaySelectedTransactions,
  onEditSelectedTransactionDate,
  onEditSelectedTransactionPeriod,
  onCopySelectedTransactions,
  onMakeRecurringSelectedTransactions,
  onNotesSelectedTransactions,
  onDeleteSelectedTransactions,
  onClearSelection,
}: TransactionBatchActionsProps<TData>) {
  const [showQuickPayConfirm, setShowQuickPayConfirm] = React.useState(false)
  const [showMakeRecurringConfirm, setShowMakeRecurringConfirm] = React.useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [showEditDateDialog, setShowEditDateDialog] = React.useState(false)
  const [showEditPeriodDialog, setShowEditPeriodDialog] = React.useState(false)
  const [showCopyDateDialog, setShowCopyDateDialog] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState("")
  const [selectedPeriod, setSelectedPeriod] = React.useState("")
  const [selectedCopyDate, setSelectedCopyDate] = React.useState("")

  React.useEffect(() => {
    if (selectedDate) return
    setSelectedDate(new Date().toISOString().split("T")[0])
  }, [selectedDate])

  React.useEffect(() => {
    if (selectedCopyDate) return
    setSelectedCopyDate(new Date().toISOString().split("T")[0])
  }, [selectedCopyDate])

  const handleQuickPaySelected = async () => {
    if (!onQuickPaySelectedTransactions || selectedData.length === 0) return
    const ok = await onQuickPaySelectedTransactions(selectedData)
    if (ok) {
      onClearSelection()
      setShowQuickPayConfirm(false)
    }
  }

  const handleEditPeriodSelected = async () => {
    if (
      !onEditSelectedTransactionPeriod ||
      selectedData.length === 0 ||
      !/^\d{4}(0[1-9]|1[0-2])$/.test(selectedPeriod)
    ) {
      return
    }
    const ok = await onEditSelectedTransactionPeriod(selectedData, selectedPeriod)
    if (ok) {
      onClearSelection()
      setShowEditPeriodDialog(false)
    }
  }

  const handleEditDateSelected = async () => {
    if (
      !onEditSelectedTransactionDate ||
      selectedData.length === 0 ||
      !selectedDate
    ) {
      return
    }
    const ok = await onEditSelectedTransactionDate(selectedData, selectedDate)
    if (ok) {
      onClearSelection()
      setShowEditDateDialog(false)
    }
  }

  const handleCopyDateSelected = async () => {
    if (
      !onCopySelectedTransactions ||
      selectedData.length === 0 ||
      !selectedCopyDate
    ) {
      return
    }
    const ok = await onCopySelectedTransactions(selectedData, selectedCopyDate)
    if (ok) {
      onClearSelection()
      setShowCopyDateDialog(false)
    }
  }

  const handleMakeRecurringSelected = async () => {
    if (!onMakeRecurringSelectedTransactions || selectedData.length === 0) return
    const ok = await onMakeRecurringSelectedTransactions(selectedData)
    if (ok) {
      onClearSelection()
      setShowMakeRecurringConfirm(false)
    }
  }

  const handleNotesSelected = async () => {
    if (!onNotesSelectedTransactions || selectedData.length === 0) return
    const ok = await onNotesSelectedTransactions(selectedData)
    if (ok) {
      onClearSelection()
    }
  }

  const handleDeleteSelected = async () => {
    if (!onDeleteSelectedTransactions || selectedData.length === 0) return
    const ok = await onDeleteSelectedTransactions(selectedData)
    if (ok) {
      onClearSelection()
      setShowDeleteConfirm(false)
    }
  }

  if (selectedCount === 0) return null

  return (
    <>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-primary text-sm font-semibold mr-1 shrink-0">
          {selectedCount}
        </span>
        <div className="bg-primary/5 border-primary/20 flex items-center gap-0.5 rounded-md border p-0.5 min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer hover:bg-muted"
                disabled={batchLoading}
                onClick={() => setShowQuickPayConfirm(true)}
              >
                <CheckCircle className="h-4 w-4 text-chart-2" />
                <span className="sr-only">Pagar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Pagar (Pagamento Rápido)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer hover:bg-muted"
                disabled={batchLoading}
                onClick={() => setShowEditDateDialog(true)}
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Editar Data</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar Data</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer hover:bg-muted"
                disabled={batchLoading}
                onClick={() => setShowEditPeriodDialog(true)}
              >
                <CalendarClock className="h-4 w-4" />
                <span className="sr-only">Editar Período</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar Período</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer hover:bg-muted"
                disabled={batchLoading}
                onClick={() => setShowMakeRecurringConfirm(true)}
              >
                <RotateCcw className="h-4 w-4 text-chart-1" />
                <span className="sr-only">Tornar recorrente</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tornar recorrente</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer hover:bg-muted"
                disabled={batchLoading}
                onClick={() => setShowCopyDateDialog(true)}
              >
                <Copy className="h-4 w-4 text-blue-500" />
                <span className="sr-only">Copiar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copiar Lançamentos</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer hover:bg-muted"
                disabled={batchLoading}
                onClick={() => void handleNotesSelected()}
              >
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="sr-only">Observações</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Observações/Mensagens</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer hover:bg-muted"
                disabled={batchLoading}
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
                <span className="sr-only">Excluir</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Excluir Lançamento</TooltipContent>
          </Tooltip>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground cursor-pointer h-8 px-2 text-[11px] sm:text-sm shrink-0"
          onClick={onClearSelection}
        >
          <span className="hidden sm:inline">Cancelar</span>
          <span className="sm:hidden">Limpar</span>
        </Button>
      </div>

      <AlertDialog open={showQuickPayConfirm} onOpenChange={setShowQuickPayConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pagamento Rápido em lote</AlertDialogTitle>
            <AlertDialogDescription>
              Confirmar pagamento rápido para {selectedCount} lançamento
              {selectedCount > 1 ? "s" : ""} usando as configurações padrão
              definidas em Configurações &gt; Geral?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={batchLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={batchLoading}
              onClick={() => void handleQuickPaySelected()}
            >
              {batchLoading ? "Processando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showEditDateDialog} onOpenChange={setShowEditDateDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Editar Data em lote</DialogTitle>
            <DialogDescription>
              Defina a data para {selectedCount} lançamento
              {selectedCount > 1 ? "s" : ""} selecionado
              {selectedCount > 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="batch-transaction-date">Data</Label>
            <Input
              id="batch-transaction-date"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDateDialog(false)}
              disabled={batchLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => void handleEditDateSelected()}
              disabled={batchLoading || !selectedDate}
            >
              {batchLoading ? "Salvando..." : "Salvar data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditPeriodDialog} onOpenChange={setShowEditPeriodDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Editar Período em lote</DialogTitle>
            <DialogDescription>
              Defina o período (YYYYMM) para {selectedCount} lançamento
              {selectedCount > 1 ? "s" : ""} selecionado
              {selectedCount > 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="batch-transaction-period">Período</Label>
            <Input
              id="batch-transaction-period"
              value={selectedPeriod}
              onChange={(event) =>
                setSelectedPeriod(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="YYYYMM"
              maxLength={6}
              inputMode="numeric"
              className="tabular-nums"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditPeriodDialog(false)}
              disabled={batchLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => void handleEditPeriodSelected()}
              disabled={
                batchLoading || !/^\d{4}(0[1-9]|1[0-2])$/.test(selectedPeriod)
              }
            >
              {batchLoading ? "Salvando..." : "Salvar período"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCopyDateDialog} onOpenChange={setShowCopyDateDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Copiar Lançamentos em lote</DialogTitle>
            <DialogDescription>
              Defina a data dos novos registros para {selectedCount} lançamento
              {selectedCount > 1 ? "s" : ""} selecionado
              {selectedCount > 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="batch-copy-transaction-date">Nova Data</Label>
            <Input
              id="batch-copy-transaction-date"
              type="date"
              value={selectedCopyDate}
              onChange={(event) => setSelectedCopyDate(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCopyDateDialog(false)}
              disabled={batchLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => void handleCopyDateSelected()}
              disabled={batchLoading || !selectedCopyDate}
            >
              {batchLoading ? "Copiando..." : "Copiar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showMakeRecurringConfirm} onOpenChange={setShowMakeRecurringConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tornar Recorrente em lote</AlertDialogTitle>
            <AlertDialogDescription>
              Confirmar criação de recorrência para {selectedCount} lançamento
              {selectedCount > 1 ? "s" : ""}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={batchLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={batchLoading}
              onClick={() => void handleMakeRecurringSelected()}
            >
              {batchLoading ? "Criando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Lançamentos em lote</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá {selectedCount} lançamento
              {selectedCount > 1 ? "s" : ""} dos registros ativos e moverá para histórico de excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={batchLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={batchLoading}
              onClick={() => void handleDeleteSelected()}
            >
              {batchLoading ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

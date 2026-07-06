"use client"

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
import { useMonetaryFormattingSafe } from "@/hooks/use-monetary-formatting"
import type { SerializedTransaction } from "../types"

interface DeleteConfirmDialogProps {
  transaction: SerializedTransaction | null
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function DeleteConfirmDialog({
  transaction,
  onConfirm,
  onCancel,
  loading,
}: DeleteConfirmDialogProps) {
  const monetary = useMonetaryFormattingSafe()

  return (
    <AlertDialog open={!!transaction} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Lançamento</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir este lançamento?
            {transaction?.note && (
              <span className="mt-1 block font-medium text-foreground">
                {transaction.note}
              </span>
            )}
            {transaction && (
              <span className="mt-0.5 block font-mono text-sm">
                {monetary.formatMonetaryValue(transaction.amount)}
              </span>
            )}
            <span className="mt-2 block">
              Esta ação pode ser desfeita pelo administrador.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface QuickPayConfirmDialogProps {
  transaction: SerializedTransaction | null
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function QuickPayConfirmDialog({
  transaction,
  onConfirm,
  onCancel,
  loading,
}: QuickPayConfirmDialogProps) {
  const monetary = useMonetaryFormattingSafe()

  return (
    <AlertDialog open={!!transaction} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Pagamento Rápido</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja marcar este lançamento como pago usando as configurações
            padrão definidas em Configurações &gt; Geral?
            {transaction?.note && (
              <span className="mt-1 block font-medium text-foreground">
                {transaction.note}
              </span>
            )}
            {transaction && (
              <span className="mt-0.5 block font-mono text-sm">
                {monetary.formatMonetaryValue(transaction.amount)}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={loading}>
            {loading ? "Processando..." : "Confirmar Pagamento"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface MakeRecurringConfirmDialogProps {
  transaction: SerializedTransaction | null
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function MakeRecurringConfirmDialog({
  transaction,
  onConfirm,
  onCancel,
  loading,
}: MakeRecurringConfirmDialogProps) {
  const monetary = useMonetaryFormattingSafe()

  return (
    <AlertDialog open={!!transaction} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tornar Recorrente</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja criar uma transação recorrente a partir deste lançamento?
            {transaction?.note && (
              <span className="mt-1 block font-medium text-foreground">
                {transaction.note}
              </span>
            )}
            {transaction && (
              <span className="mt-0.5 block font-mono text-sm">
                {monetary.formatMonetaryValue(transaction.amount)}
              </span>
            )}
            <span className="mt-2 block">
              A transação original não será afetada. Um novo modelo recorrente
              será criado na página Recorrentes.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={loading}>
            {loading ? "Criando..." : "Criar Recorrente"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

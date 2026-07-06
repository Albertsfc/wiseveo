"use client"

import {
  CheckCircle,
  Copy,
  Pencil,
  RotateCcw,
  Paperclip,
  MessageSquare,
  Trash2,
} from "lucide-react"
import {
  SmoothDropdown,
  type SmoothDropdownEntry,
} from "@/components/ui/smooth-dropdown"
import type { SerializedTransaction } from "../types"

interface TransactionActionsProps {
  transaction: SerializedTransaction
  onQuickPay?: (tx: SerializedTransaction) => void
  onEdit?: (tx: SerializedTransaction) => void
  onCopy?: (tx: SerializedTransaction) => void
  onMakeRecurring?: (tx: SerializedTransaction) => void
  onAttachments?: (tx: SerializedTransaction) => void
  onNotes?: (tx: SerializedTransaction) => void
  onDelete?: (tx: SerializedTransaction) => void
  triggerClassName?: string
}

export function TransactionActions({
  transaction,
  onQuickPay = () => {},
  onEdit = () => {},
  onCopy = () => {},
  onMakeRecurring = () => {},
  onAttachments = () => {},
  onNotes = () => {},
  onDelete = () => {},
  triggerClassName,
}: TransactionActionsProps) {
  const items: SmoothDropdownEntry[] = [
    {
      id: "quick-pay",
      label: "Pagar (Pagamento Rápido)",
      icon: CheckCircle,
      iconClassName: "text-chart-2",
      onClick: () => onQuickPay(transaction),
    },
    {
      id: "edit",
      label: "Editar Lançamento",
      icon: Pencil,
      onClick: () => onEdit(transaction),
    },
    {
      id: "copy",
      label: "Copiar Lançamento",
      icon: Copy,
      iconClassName: "text-blue-500",
      onClick: () => onCopy(transaction),
    },
    {
      id: "make-recurring",
      label: "Tornar recorrente",
      icon: RotateCcw,
      iconClassName: "text-chart-1",
      onClick: () => onMakeRecurring(transaction),
    },
    {
      id: "attachments",
      label: "Anexos",
      icon: Paperclip,
      badge: transaction.attachmentCount > 0 ? transaction.attachmentCount : undefined,
      badgeClassName: "bg-yellow-400 text-yellow-950",
      iconClassName: "text-chart-4",
      onClick: () => onAttachments(transaction),
    },
    {
      id: "notes",
      label: "Observações/Mensagens",
      icon: MessageSquare,
      badge: transaction.messageCount > 0 ? transaction.messageCount : undefined,
      badgeClassName: "bg-primary text-primary-foreground",
      iconClassName: "text-primary",
      onClick: () => onNotes(transaction),
    },
    { id: "separator", separator: true },
    {
      id: "delete",
      label: "Excluir Lançamento",
      icon: Trash2,
      variant: "destructive",
      onClick: () => onDelete(transaction),
    },
  ]

  return (
    <SmoothDropdown
      items={items}
      align="end"
      menuWidth={240}
      triggerClassName={triggerClassName}
      triggerBadges={[
        {
          id: "attachments",
          value: transaction.attachmentCount,
          className: "bg-yellow-400 text-yellow-950",
        },
        {
          id: "messages",
          value: transaction.messageCount,
          className: "bg-primary text-primary-foreground",
        },
      ]}
    />
  )
}

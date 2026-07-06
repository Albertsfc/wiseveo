"use client"

import { Pencil, Play, Trash2 } from "lucide-react"

import {
  SmoothDropdown,
  type SmoothDropdownEntry,
} from "@/components/ui/smooth-dropdown"
import type { SerializedRecurringTransaction } from "../types"

interface RecurringActionsProps {
  recurring: SerializedRecurringTransaction
  onLaunch?: (recurring: SerializedRecurringTransaction) => void
  onEdit?: (recurring: SerializedRecurringTransaction) => void
  onDelete?: (recurring: SerializedRecurringTransaction) => void
}

export function RecurringActions({
  recurring,
  onLaunch,
  onEdit,
  onDelete,
}: RecurringActionsProps) {
  const items: SmoothDropdownEntry[] = [
    {
      id: "launch-transaction",
      label: "Lançar Transação",
      icon: Play,
      iconClassName: "text-chart-2",
      onClick: () => onLaunch?.(recurring),
    },
    {
      id: "edit",
      label: "Editar",
      icon: Pencil,
      onClick: () => onEdit?.(recurring),
    },
    { id: "separator", separator: true },
    {
      id: "delete",
      label: "Excluir",
      icon: Trash2,
      variant: "destructive",
      onClick: () => onDelete?.(recurring),
    },
  ]

  return <SmoothDropdown items={items} align="end" />
}

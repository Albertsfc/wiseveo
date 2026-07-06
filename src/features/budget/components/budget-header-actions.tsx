"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreateBudgetDialog } from "./create-budget-dialog"
import type { GroupWithCategories } from "../types"

interface BudgetHeaderActionsProps {
  groups: GroupWithCategories[]
}

export function BudgetHeaderActions({ groups }: BudgetHeaderActionsProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Novo Orçamento
      </Button>
      <CreateBudgetDialog open={open} onOpenChange={setOpen} groups={groups} />
    </>
  )
}

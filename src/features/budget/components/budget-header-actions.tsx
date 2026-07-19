"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreateBudgetDialog } from "./create-budget-dialog"
import type { GroupWithCategories } from "../types"

interface BudgetHeaderActionsProps {
  groups: GroupWithCategories[]
}

export function BudgetHeaderActions({ groups }: BudgetHeaderActionsProps) {
  const t = useTranslations("budget")
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        {t("newBudget")}
      </Button>
      <CreateBudgetDialog open={open} onOpenChange={setOpen} groups={groups} />
    </>
  )
}

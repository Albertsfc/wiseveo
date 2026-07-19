"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { CreateBudgetDialog } from "./create-budget-dialog"
import type { GroupWithCategories } from "../types"

interface NewBudgetCardProps {
  groups: GroupWithCategories[]
}

export function NewBudgetCard({ groups }: NewBudgetCardProps) {
  const t = useTranslations("budget")
  const [open, setOpen] = useState(false)

  return (
    <>
      <Card
        className="@container/card cursor-pointer border-dashed transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 group"
        onClick={() => setOpen(true)}
      >
        <div className="flex flex-col items-center justify-center gap-3 py-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 text-muted-foreground/50 transition-all duration-200 group-hover:border-primary/50 group-hover:text-primary group-hover:scale-110">
            <Plus className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {t("newBudget")}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              {t("newCard.subtitle")}
            </p>
          </div>
        </div>
      </Card>

      <CreateBudgetDialog
        open={open}
        onOpenChange={setOpen}
        groups={groups}
      />
    </>
  )
}

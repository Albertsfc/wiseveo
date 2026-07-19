"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers"
import { useDateRange } from "@/contexts/date-range-context"

import { BudgetOverviewCard } from "./budget-overview-card"
import { BudgetItemCard } from "./budget-item-card"
import { BudgetSortableItem } from "./budget-sortable-item"
import { BudgetSummaryCards } from "./budget-summary-cards"
import { FormulaManagerCard } from "./formula-manager-card"
import { NewBudgetCard } from "./new-budget-card"
import { CreateBudgetDialog } from "./create-budget-dialog"
import { updateBudgetOrder } from "../services/update-budget-order"
import { SectionCardsGrid } from "@/components/section-cards-grid"
import type { BudgetPageData, BudgetItem } from "../types"

interface BudgetClientProps {
  data: BudgetPageData
}

export function BudgetClient({ data: initialData }: BudgetClientProps) {
  const t = useTranslations("budget")
  const { dateRange } = useDateRange()
  const [data, setData] = useState<BudgetPageData>(initialData)
  const [items, setItems] = useState(data.items)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)
  const [editItem, setEditItem] = useState<BudgetItem | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const latestRequestRef = useRef(0)

  const handleEdit = (item: BudgetItem) => {
    setEditItem(item)
    setIsEditOpen(true)
  }

  // Fetch data when dateRange changes
  useEffect(() => {
    const fetchBudgetData = async () => {
      const requestId = ++latestRequestRef.current
      setLoading(true)
      try {
        const params = new URLSearchParams({
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString(),
        })
        const res = await fetch(`/api/budget?${params}`, { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to fetch budget data")
        const newData = await res.json()
        
        if (requestId !== latestRequestRef.current) return
        
        setData(newData)
        setItems(newData.items)
      } catch (error) {
        if (requestId !== latestRequestRef.current) return
        console.error("Failed to fetch budget data:", error)
      } finally {
        if (requestId !== latestRequestRef.current) return
        setLoading(false)
      }
    }

    fetchBudgetData()
  }, [dateRange])

  // Sync items when data.items changes (e.g. after fetch)
  useEffect(() => {
    setItems(data.items)
  }, [data.items])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((it) => it.id === active.id)
      const newIndex = items.findIndex((it) => it.id === over.id)
      const newItems = arrayMove(items, oldIndex, newIndex)

      setItems(newItems)

      startTransition(async () => {
        await updateBudgetOrder(newItems.map((it) => it.id))
      })
    }
  }

  const hasAnyHistory = items.some((it) => it.hasHistory)

  return (
    <>
      {/* Summary Cards */}
      <div className={`px-4 lg:px-6 transition-opacity duration-200 ${loading ? "opacity-50" : ""}`}>
        <BudgetSummaryCards
          totalLimit={data.totalLimit}
          totalSpent={data.totalSpent}
          totalPaid={data.totalPaid}
          totalScheduled={data.totalScheduled}
          overallPct={data.overallPct}
          itemCount={items.length}
        />
      </div>

      {/* Visualization Row (12-col: Overview 8 + Fórmula 4) */}
      <div className={`px-4 lg:px-6 transition-opacity duration-200 ${loading ? "opacity-50" : ""}`}>
        <div className="grid grid-cols-12 items-stretch gap-4">
          <div className="col-span-12 lg:col-span-8 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
            <BudgetOverviewCard data={{ ...data, items }} />
          </div>
          <div className="col-span-12 lg:col-span-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
            <FormulaManagerCard
              formulaConfig={data.formulaConfig}
              hasAnyHistory={hasAnyHistory}
            />
          </div>
        </div>
      </div>

      {/* Sortable Budget Cards */}
      <div className={`px-4 lg:px-6 transition-opacity duration-200 ${loading ? "opacity-50" : ""}`}>
        {isPending && (
          <p className="text-xs text-muted-foreground animate-pulse mb-2">
            {t("client.savingOrder")}
          </p>
        )}
        {loading && (
          <p className="text-xs text-muted-foreground animate-pulse mb-2">
            {t("client.updatingBudget")}
          </p>
        )}
        <DndContext
          id="budget-dnd-context"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToFirstScrollableAncestor]}
        >
          <SortableContext items={items.map((it) => it.id)} strategy={rectSortingStrategy}>
            <SectionCardsGrid className="lg:grid-cols-3 xl:grid-cols-3">
              {items.map((item, index) => (
                <BudgetSortableItem
                  key={item.id}
                  item={item}
                  index={index}
                  formulaConfig={data.formulaConfig}
                  onEdit={handleEdit}
                />
              ))}
              <NewBudgetCard groups={data.groups} />
            </SectionCardsGrid>
          </SortableContext>

          <DragOverlay adjustScale={true}>
            {activeId ? (
              <BudgetItemCard
                item={items.find((it) => it.id === activeId)!}
                index={items.findIndex((it) => it.id === activeId)}
                formulaConfig={data.formulaConfig}
                isDragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Edit Dialog */}
      <CreateBudgetDialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open)
          if (!open) setTimeout(() => setEditItem(null), 300)
        }}
        groups={data.groups}
        editItem={editItem || undefined}
      />
    </>
  )
}


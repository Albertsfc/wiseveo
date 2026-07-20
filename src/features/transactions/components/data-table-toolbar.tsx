"use client"

import { type Table } from "@tanstack/react-table"
import { RefreshCcw, Filter } from "lucide-react"
import { useTranslations } from "next-intl"
import { useDeviceClass } from "@/hooks/use-device-class"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"

import type { TransactionFilterOptions } from "../types"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  filterOptions: TransactionFilterOptions
}

export function DataTableToolbar<TData>({
  table,
  filterOptions,
}: DataTableToolbarProps<TData>) {
  const { isMobile } = useDeviceClass()
  const t = useTranslations("transactions.filters")
  const tColumns = useTranslations("transactions.columns")

  const statusLabels: Record<string, string> = {
    PAID: tColumns("statusPaid"),
    PENDING: tColumns("statusPending"),
    OVERDUE: tColumns("statusOverdue"),
    SCHEDULED: tColumns("statusScheduled"),
  }

  const typeLabels: Record<string, string> = {
    INCOME: tColumns("typeIncome"),
    EXPENSE: tColumns("typeExpense"),
    TRANSFER: tColumns("typeTransfer"),
  }

  const isFiltered =
    table.getState().columnFilters.length > 0 || !!table.getState().globalFilter

  const handleFilterChange = (columnId: string, value: string) => {
    const column = table.getColumn(columnId)
    if (value === "all") {
      column?.setFilterValue(undefined)
    } else {
      column?.setFilterValue(value)
    }
  }

  const statusFilter = table.getColumn("status")?.getFilterValue() as
    | string
    | undefined
  const typeFilter = table.getColumn("type")?.getFilterValue() as
    | string
    | undefined
  const accountFilter = table.getColumn("account")?.getFilterValue() as
    | string
    | undefined

  if (isMobile) {
    return (
      <div className="flex items-center gap-2">
        <Input
          placeholder={t("searchPlaceholderMobile")}
          value={table.getState().globalFilter ?? ""}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          className="flex-1 h-9"
        />

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-xs">{t("filtersButton")}</span>
              {table.getState().columnFilters.length > 0 && (
                <span className="bg-primary text-primary-foreground flex h-4 w-4 items-center justify-center rounded-full text-[10px]">
                  {table.getState().columnFilters.length}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="px-6 pb-8">
            <SheetHeader>
              <SheetTitle>{t("filterSheetTitle")}</SheetTitle>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <span className="text-sm font-medium">{t("statusFieldLabel")}</span>
                <Select
                  value={statusFilter || "all"}
                  onValueChange={(v) => handleFilterChange("status", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("statusFieldLabel")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allStatuses")}</SelectItem>
                    {filterOptions.statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status] || status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">{t("typeFieldLabel")}</span>
                <Select
                  value={typeFilter || "all"}
                  onValueChange={(v) => handleFilterChange("type", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("typeFieldLabel")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allTypes")}</SelectItem>
                    {filterOptions.types.map((type) => (
                      <SelectItem key={type} value={type}>
                        {typeLabels[type] || type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">{t("accountFieldLabel")}</span>
                <Select
                  value={accountFilter || "all"}
                  onValueChange={(v) => handleFilterChange("account", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("accountFieldLabel")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allAccounts")}</SelectItem>
                    {filterOptions.accounts.map((account) => (
                      <SelectItem key={account.id} value={account.name}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SheetFooter className="flex flex-row gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  table.resetColumnFilters()
                  table.setGlobalFilter("")
                }}
                disabled={!isFiltered}
              >
                {t("clear")}
              </Button>
              <SheetClose asChild>
                <Button className="flex-1">{t("apply")}</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Select
          value={statusFilter || "all"}
          onValueChange={(v) => handleFilterChange("status", v)}
        >
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue placeholder={t("statusFieldLabel")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">
              {t("allStatuses")}
            </SelectItem>
            {filterOptions.statuses.map((status) => (
              <SelectItem key={status} value={status} className="cursor-pointer">
                {statusLabels[status] || status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={typeFilter || "all"}
          onValueChange={(v) => handleFilterChange("type", v)}
        >
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue placeholder={t("typeFieldLabel")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">
              {t("allTypes")}
            </SelectItem>
            {filterOptions.types.map((type) => (
              <SelectItem key={type} value={type} className="cursor-pointer">
                {typeLabels[type] || type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={accountFilter || "all"}
          onValueChange={(v) => handleFilterChange("account", v)}
        >
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue placeholder={t("accountFieldLabel")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">
              {t("allAccounts")}
            </SelectItem>
            {filterOptions.accounts.map((account) => (
              <SelectItem
                key={account.id}
                value={account.name}
                className="cursor-pointer"
              >
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder={t("searchPlaceholderDesktop")}
            value={table.getState().globalFilter ?? ""}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="w-[200px] lg:w-[300px] cursor-text"
          />
          <Button
            variant="outline"
            onClick={() => {
              table.resetColumnFilters()
              table.setGlobalFilter("")
            }}
            className="px-3 cursor-pointer"
            disabled={!isFiltered}
          >
            <RefreshCcw className="h-4 w-4" />
            <span className="hidden lg:block">{t("clearFiltersButton")}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

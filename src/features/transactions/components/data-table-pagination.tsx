"use client"

import * as React from "react"
import type { Table } from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMonetaryFormattingSafe } from "@/hooks/use-monetary-formatting"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  const monetary = useMonetaryFormattingSafe()

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const filteredRows = table.getFilteredRowModel().rows

  const { hasAmount, incomes, expenses, total } = React.useMemo(() => {
    const firstRow = filteredRows[0]?.original as any
    const hasAmount = !!firstRow && typeof firstRow.amount === "number"

    if (!hasAmount) return { hasAmount: false, incomes: 0, expenses: 0, total: 0 }

    let incomes = 0
    let expenses = 0
    let total = 0

    selectedRows.forEach((row) => {
      const amount = (row.original as any).amount || 0
      if (amount > 0) incomes += amount
      else if (amount < 0) expenses += amount
    })

    filteredRows.forEach((row) => {
      total += (row.original as any).amount || 0
    })

    return { hasAmount, incomes, expenses, total }
  }, [selectedRows, filteredRows])

  return (
    <div className="flex items-center justify-between px-4">
      <div className="text-muted-foreground hidden flex-1 text-sm lg:flex flex-col gap-0">
        <div>
          {selectedRows.length} de {filteredRows.length} linha(s) selecionada(s).
        </div>
        {hasAmount && (
          <>
            <div>Entradas: {monetary.formatNumberValue(incomes)}</div>
            <div>Saídas: {monetary.formatNumberValue(expenses)}</div>
            <div>Total: {monetary.formatNumberValue(total)}</div>
          </>
        )}
      </div>
      <div className="flex w-full items-center gap-8 lg:w-fit">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor="rows-per-page" className="text-sm font-medium">
            Linhas por página
          </Label>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger
              size="sm"
              className="w-20 cursor-pointer"
              id="rows-per-page"
            >
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-fit items-center justify-center text-sm font-medium">
          Página {table.getState().pagination.pageIndex + 1} de{" "}
          {table.getPageCount()}
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex cursor-pointer"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Primeira página</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            className="size-8 cursor-pointer"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Página anterior</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            className="size-8 cursor-pointer"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Próxima página</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            className="hidden size-8 lg:flex cursor-pointer"
            size="icon"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Última página</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  )
}

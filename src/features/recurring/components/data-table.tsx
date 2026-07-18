"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    type VisibilityState,
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { DataTablePagination } from "../../transactions/components/data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"
import type { RecurringFilterOptions, SerializedRecurringTransaction } from "../types"
import { useDeviceClass } from "@/hooks/use-device-class"
import { RecurringCardMobile } from "./recurring-card-mobile"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    filterOptions: RecurringFilterOptions
    loading?: boolean
    onLaunchRecurring?: (recurring: SerializedRecurringTransaction) => void
    onEditRecurring?: (recurring: SerializedRecurringTransaction) => void
    onDeleteRecurring?: (recurring: SerializedRecurringTransaction) => void
    onLaunchSelectedRecurring?: (items: SerializedRecurringTransaction[]) => Promise<boolean>
    onEditSelectedRecurringDate?: (items: SerializedRecurringTransaction[], date: string) => Promise<boolean>
    onDeleteSelectedRecurring?: (items: SerializedRecurringTransaction[]) => Promise<boolean>
    batchLoading?: boolean
}

export function DataTable<TData, TValue>({
    columns,
    data,
    filterOptions,
    loading,
    onLaunchRecurring,
    onEditRecurring,
    onDeleteRecurring,
    onLaunchSelectedRecurring,
    onEditSelectedRecurringDate,
    onDeleteSelectedRecurring,
    batchLoading,
}: DataTableProps<TData, TValue>) {
    const { isMobile } = useDeviceClass()
    const t = useTranslations("recurring.table")
    const tCommon = useTranslations("common")
    const [rowSelection, setRowSelection] = React.useState({})
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [sorting, setSorting] = React.useState<SortingState>([])

    const isLoadingStorage = React.useRef(true)

    // Load from local storage on mount
    React.useEffect(() => {
        try {
            const savedFilters = localStorage.getItem('wiseveo-recurring-filters');
            if (savedFilters) setColumnFilters(JSON.parse(savedFilters));

            const savedSorting = localStorage.getItem('wiseveo-recurring-sorting');
            if (savedSorting) setSorting(JSON.parse(savedSorting));

            const savedVisibility = localStorage.getItem('wiseveo-recurring-visibility');
            if (savedVisibility) setColumnVisibility(JSON.parse(savedVisibility));
        } catch (e) {
            console.error('Failed to parse recurring table settings', e);
        } finally {
            isLoadingStorage.current = false;
        }
    }, []);

    // Save to local storage when state changes
    React.useEffect(() => {
        if (isLoadingStorage.current) return;
        localStorage.setItem('wiseveo-recurring-filters', JSON.stringify(columnFilters));
    }, [columnFilters]);

    React.useEffect(() => {
        if (isLoadingStorage.current) return;
        localStorage.setItem('wiseveo-recurring-sorting', JSON.stringify(sorting));
    }, [sorting]);

    React.useEffect(() => {
        if (isLoadingStorage.current) return;
        localStorage.setItem('wiseveo-recurring-visibility', JSON.stringify(columnVisibility));
    }, [columnVisibility]);

    const table = useReactTable({
        data,
        columns,
        meta: {
            onLaunchRecurring,
            onEditRecurring,
            onDeleteRecurring,
        },
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    })

    return (
        <div className="flex flex-col gap-4">
            <DataTableToolbar
                table={table}
                filterOptions={filterOptions}
                onLaunchSelected={onLaunchSelectedRecurring as ((rows: TData[]) => Promise<boolean>) | undefined}
                onEditSelectedDate={onEditSelectedRecurringDate as ((rows: TData[], date: string) => Promise<boolean>) | undefined}
                onDeleteSelected={onDeleteSelectedRecurring as ((rows: TData[]) => Promise<boolean>) | undefined}
                batchLoading={batchLoading}
            />
            {isMobile ? (
                <div className="flex flex-col gap-3">
                    {loading ? (
                        <div className="h-24 flex items-center justify-center text-muted-foreground">
                            {tCommon("loading")}
                        </div>
                    ) : table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <RecurringCardMobile
                                key={row.id}
                                recurring={row.original as SerializedRecurringTransaction}
                                onLaunch={onLaunchRecurring}
                                onEdit={onEditRecurring}
                                onDelete={onDeleteRecurring}
                            />
                        ))
                    ) : (
                        <div className="h-24 flex items-center justify-center text-muted-foreground">
                            {t("noResults")}
                        </div>
                    )}
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border">
                    <Table>
                        <TableHeader className="bg-muted sticky top-0 z-10">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead key={header.id} colSpan={header.colSpan}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        )
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody className="**:data-[slot=table-cell]:first:w-8">
                            {loading ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        {tCommon("loading")}
                                    </TableCell>
                                </TableRow>
                            ) : table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        {t("noResults")}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
            <DataTablePagination table={table} />
        </div>
    )
}

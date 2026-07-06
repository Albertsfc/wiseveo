"use client"

import * as React from "react"
import { Play, Trash2, Pencil, RotateCcw, Filter } from "lucide-react"
import { useDeviceClass } from "@/hooks/use-device-class"
import type { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose,
} from "@/components/ui/sheet"
import { DataTableViewOptions } from "@/features/transactions/components/data-table-view-options"
import type { RecurringFilterOptions } from "../types"

const typeLabels: Record<string, string> = {
    INCOME: "Receita",
    EXPENSE: "Despesa",
    TRANSFER: "Transferência",
}

interface DataTableToolbarProps<TData> {
    table: Table<TData>
    filterOptions: RecurringFilterOptions
    onLaunchSelected?: (rows: TData[]) => Promise<boolean>
    onEditSelectedDate?: (rows: TData[], date: string) => Promise<boolean>
    onDeleteSelected?: (rows: TData[]) => Promise<boolean>
    batchLoading?: boolean
}

export function DataTableToolbar<TData>({
    table,
    filterOptions,
    onLaunchSelected,
    onEditSelectedDate,
    onDeleteSelected,
    batchLoading,
}: DataTableToolbarProps<TData>) {
    const { isMobile } = useDeviceClass()
    const isFiltered = table.getState().columnFilters.length > 0
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const selectedData = selectedRows.map((row) => row.original)
    const [showLaunchConfirm, setShowLaunchConfirm] = React.useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
    const [showEditDateDialog, setShowEditDateDialog] = React.useState(false)
    const [selectedDate, setSelectedDate] = React.useState(
        new Date().toISOString().split("T")[0]
    )

    const handleFilterChange = (columnId: string, value: string) => {
        const column = table.getColumn(columnId)
        if (value === "all") {
            column?.setFilterValue(undefined)
        } else {
            column?.setFilterValue(value)
        }
    }

    const typeFilter = table.getColumn("type")?.getFilterValue() as string | undefined

    const handleLaunch = async () => {
        if (!onLaunchSelected || selectedData.length === 0) return
        const ok = await onLaunchSelected(selectedData)
        if (ok) {
            table.resetRowSelection()
            setShowLaunchConfirm(false)
        }
    }

    const handleEditDate = async () => {
        if (!onEditSelectedDate || selectedData.length === 0 || !selectedDate) return
        const ok = await onEditSelectedDate(selectedData, selectedDate)
        if (ok) {
            table.resetRowSelection()
            setShowEditDateDialog(false)
        }
    }

    const handleDelete = async () => {
        if (!onDeleteSelected || selectedData.length === 0) return
        const ok = await onDeleteSelected(selectedData)
        if (ok) {
            table.resetRowSelection()
            setShowDeleteConfirm(false)
        }
    }

    return (
        <div className="flex flex-col gap-4">
            {isMobile ? (
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Buscar..."
                        value={(table.getColumn("description")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("description")?.setFilterValue(event.target.value)
                        }
                        className="flex-1 h-9"
                    />

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 gap-2">
                                <Filter className="h-4 w-4" />
                                <span className="text-xs">Filtros</span>
                                {table.getState().columnFilters.length > 0 && (
                                    <span className="bg-primary text-primary-foreground flex h-4 w-4 items-center justify-center rounded-full text-[10px]">
                                        {table.getState().columnFilters.length}
                                    </span>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="px-6 pb-8">
                            <SheetHeader>
                                <SheetTitle>Filtrar Recorrências</SheetTitle>
                            </SheetHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <span className="text-sm font-medium">Tipo</span>
                                    <Select
                                        value={typeFilter || "all"}
                                        onValueChange={(v) => handleFilterChange("type", v)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos os tipos</SelectItem>
                                            {filterOptions.types.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {typeLabels[type] || type}
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
                                    onClick={() => table.resetColumnFilters()}
                                    disabled={!isFiltered}
                                >
                                    Limpar
                                </Button>
                                <SheetClose asChild>
                                    <Button className="flex-1">Aplicar</Button>
                                </SheetClose>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>
                </div>
            ) : (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-1 items-center gap-2">
                        <Input
                            placeholder="Busca inteligente..."
                            value={(table.getColumn("description")?.getFilterValue() as string) ?? ""}
                            onChange={(event) =>
                                table.getColumn("description")?.setFilterValue(event.target.value)
                            }
                            className="h-9 w-[200px] lg:w-[300px]"
                        />

                        <Select
                            value={typeFilter || "all"}
                            onValueChange={(v) => handleFilterChange("type", v)}
                        >
                            <SelectTrigger className="h-9 w-[150px] cursor-pointer">
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="cursor-pointer">Todos os tipos</SelectItem>
                                {filterOptions.types.map((type) => (
                                    <SelectItem key={type} value={type} className="cursor-pointer">
                                        {typeLabels[type] || type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {isFiltered && (
                            <Button
                                variant="ghost"
                                onClick={() => table.resetColumnFilters()}
                                className="h-9 px-2 lg:px-3 text-muted-foreground"
                            >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Limpar
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                            <DataTableViewOptions table={table} />
                        </div>
                    </div>
                </div>
            )}

            {selectedRows.length > 0 && (
                <div className="bg-primary/5 border-primary/20 flex items-center justify-between rounded-lg border px-3 py-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center gap-4">
                        <span className="text-primary text-sm font-semibold">
                            {selectedRows.length} selecionado{selectedRows.length > 1 ? "s" : ""}
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-chart-2 border-chart-2/30 hover:bg-chart-2/10 h-8 gap-2"
                                title="Lançar selecionados"
                                disabled={batchLoading}
                                onClick={() => setShowLaunchConfirm(true)}
                            >
                                <Play className="h-4 w-4" />
                                Lançar
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-2"
                                title="Editar data dos selecionados"
                                disabled={batchLoading}
                                onClick={() => setShowEditDateDialog(true)}
                            >
                                <Pencil className="h-4 w-4" />
                                Editar Data
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive/30 hover:bg-destructive/10 h-8 gap-2"
                                title="Excluir selecionados"
                                disabled={batchLoading}
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                <Trash2 className="h-4 w-4" />
                                Excluir
                            </Button>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => table.resetRowSelection()}
                        className="text-muted-foreground h-8"
                    >
                        Cancelar
                    </Button>
                </div>
            )}

            <AlertDialog open={showLaunchConfirm} onOpenChange={setShowLaunchConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Lançar Transações</AlertDialogTitle>
                        <AlertDialogDescription>
                            Confirmar lançamento de {selectedRows.length} recorrência
                            {selectedRows.length > 1 ? "s" : ""}?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={batchLoading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction disabled={batchLoading} onClick={() => void handleLaunch()}>
                            {batchLoading ? "Lançando..." : "Lançar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={showEditDateDialog} onOpenChange={setShowEditDateDialog}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>Editar Data em Lote</DialogTitle>
                        <DialogDescription>
                            Defina a data para {selectedRows.length} recorrência
                            {selectedRows.length > 1 ? "s" : ""} selecionada
                            {selectedRows.length > 1 ? "s" : ""}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="batch-recurring-date">Data</Label>
                        <Input
                            id="batch-recurring-date"
                            type="date"
                            value={selectedDate}
                            onChange={(event) => setSelectedDate(event.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowEditDateDialog(false)}
                            disabled={batchLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => void handleEditDate()}
                            disabled={batchLoading || !selectedDate}
                        >
                            {batchLoading ? "Salvando..." : "Salvar data"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Recorrências</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação excluirá {selectedRows.length} recorrência
                            {selectedRows.length > 1 ? "s" : ""} permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={batchLoading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={batchLoading}
                            onClick={() => void handleDelete()}
                        >
                            {batchLoading ? "Excluindo..." : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

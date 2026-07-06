"use client"

import { useState, useTransition, useEffect } from "react"
import { Check, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FORMULA_DEFINITIONS,
  getFormulaDefinition,
  type FormulaVariable,
} from "../services/formula-engine"
import { saveCardFormula } from "../services/save-budget-formula"
import type { BudgetFormulaPreferences, FormulaId, FormulaParams } from "../types"
import { useRouter } from "next/navigation"

interface ConfigCardFormulaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cardId: string
  cardName: string
  formulaConfig: BudgetFormulaPreferences
}

export function ConfigCardFormulaDialog({
  open,
  onOpenChange,
  cardId,
  cardName,
  formulaConfig,
}: ConfigCardFormulaDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const existingOverride = formulaConfig.perCard[cardId]
  
  const [selectedId, setSelectedId] = useState<FormulaId>(
    existingOverride?.id || formulaConfig.global.id
  )
  const [params, setParams] = useState<FormulaParams>(
    existingOverride?.params || formulaConfig.global.params
  )

  useEffect(() => {
    if (open) {
      const override = formulaConfig.perCard[cardId]
      if (override) {
        setSelectedId(override.id)
        setParams(override.params || {})
      } else {
        setSelectedId(formulaConfig.global.id)
        setParams(formulaConfig.global.params || {})
      }
    }
  }, [open, cardId, formulaConfig])

  const definition = getFormulaDefinition(selectedId)
  const isCustomDef = formulaConfig.customPresets?.find((p) => p.id === selectedId)

  const handleFormulaChange = (id: string) => {
    const newId = id as FormulaId
    setSelectedId(newId)

    const def = getFormulaDefinition(newId)
    if (def) {
      const defaults: FormulaParams = {}
      for (const v of def.variables) {
        ;(defaults as any)[v.key] = v.defaultValue
      }
      setParams(defaults)
    } else if (formulaConfig.customPresets?.some(p => p.id === newId)) {
      setParams({ months: 3, containment: 0, margin: 0 })
    }
  }

  const handleParamChange = (key: keyof FormulaParams, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    startTransition(async () => {
      await saveCardFormula(cardId, { id: selectedId, params })
      onOpenChange(false)
      router.refresh()
    })
  }

  const handleRestoreGlobal = () => {
    startTransition(async () => {
      await saveCardFormula(cardId, null)
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Fórmula do Cartão</DialogTitle>
          <DialogDescription>
            Configurar regra de orçamento customizada para <strong>{cardName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Formula Selector */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Abordagem</Label>
            <div className="flex gap-2 w-full">
              <Select value={selectedId} onValueChange={handleFormulaChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMULA_DEFINITIONS.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      <span className="flex items-center gap-2">
                        <span>{f.icon}</span>
                        <span>{f.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                  {formulaConfig.customPresets && formulaConfig.customPresets.length > 0 && (
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                      Mecanismos Customizados
                    </div>
                  )}
                  {formulaConfig.customPresets?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <span>⚡</span>
                        <span>{p.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {definition && (
              <p className="text-xs text-muted-foreground">
                {definition.description}
              </p>
            )}
          </div>

          {/* Dynamic Variables */}
          {definition && (
            <div className="grid grid-cols-2 gap-3">
              {definition.variables.map((v: FormulaVariable) => (
                <div key={v.key} className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {v.label}
                    {v.type === "percent" && " (%)"}
                  </Label>
                  <Input
                    type="number"
                    min={v.min}
                    max={v.max}
                    step={v.step}
                    value={(params as any)[v.key] ?? v.defaultValue}
                    onChange={(e) =>
                      handleParamChange(
                        v.key,
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="tabular-nums font-mono text-sm h-9"
                  />
                </div>
              ))}
            </div>
          )}

          {isCustomDef && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Meses (Histórico)</Label>
                <Input type="number" min={1} max={24} value={params.months ?? 3} onChange={(e) => handleParamChange("months", parseFloat(e.target.value)||0)} className="tabular-nums font-mono text-sm h-9" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contenção (%)</Label>
                <Input type="number" min={0} value={params.containment ?? 0} onChange={(e) => handleParamChange("containment", parseFloat(e.target.value)||0)} className="tabular-nums font-mono text-sm h-9" />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Margem Extra (%)</Label>
                <Input type="number" min={0} value={params.margin ?? 0} onChange={(e) => handleParamChange("margin", parseFloat(e.target.value)||0)} className="tabular-nums font-mono text-sm h-9" />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center sm:justify-between w-full mt-2">
          {existingOverride ? (
             <Button
               variant="outline"
               onClick={handleRestoreGlobal}
               disabled={isPending}
               className="text-muted-foreground"
             >
               {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
               Restaurar Padrão Global
             </Button>
          ) : <div />}
          <Button
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Check className="h-4 w-4 mr-1" />
            )}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

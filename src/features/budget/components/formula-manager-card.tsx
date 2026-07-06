"use client"

import { useState, useTransition } from "react"
import { FlaskConical, Check, Edit2, Trash2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  FORMULA_DEFINITIONS,
  getFormulaDefinition,
  type FormulaVariable,
} from "../services/formula-engine"
import { CreateCustomFormulaDialog } from "./create-custom-formula-dialog"
import { saveBudgetFormula } from "../services/save-budget-formula"
import type {
  BudgetFormulaPreferences,
  FormulaId,
  FormulaParams,
} from "../types"
import { useRouter } from "next/navigation"

interface FormulaManagerCardProps {
  formulaConfig: BudgetFormulaPreferences
  hasAnyHistory: boolean
}

export function FormulaManagerCard({
  formulaConfig,
  hasAnyHistory,
}: FormulaManagerCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedId, setSelectedId] = useState<FormulaId>(
    formulaConfig.global.id
  )
  const [params, setParams] = useState<FormulaParams>(
    formulaConfig.global.params
  )
  const [saved, setSaved] = useState(false)
  const [isCreatorOpen, setIsCreatorOpen] = useState(false)

  const definition = getFormulaDefinition(selectedId)
  const isCustomDef = formulaConfig.customPresets?.find((p) => p.id === selectedId)

  const [editPreset, setEditPreset] = useState<any>(null)

  const openCreator = (preset?: any) => {
    setEditPreset(preset || null)
    setIsCreatorOpen(true)
  }

  const handleDeleteCustomPreset = () => {
    if (!isCustomDef) return
    startTransition(async () => {
      const newConfig: BudgetFormulaPreferences = {
        ...formulaConfig,
        customPresets: formulaConfig.customPresets?.filter((p) => p.id !== selectedId),
      }
      if (newConfig.global.id === selectedId) {
        newConfig.global = { id: "simple_avg", params: { months: 3, containment: 0 } }
      }
      await saveBudgetFormula(newConfig)
      setSelectedId("simple_avg")
      router.refresh()
    })
  }

  const handleFormulaChange = (id: string) => {
    const newId = id as FormulaId
    setSelectedId(newId)
    setSaved(false)

    // Reset params to defaults for the new formula
    const def = getFormulaDefinition(newId)
    if (def) {
      const defaults: FormulaParams = {}
      for (const v of def.variables) {
        ;(defaults as any)[v.key] = v.defaultValue
      }
      setParams(defaults)
    } else if (formulaConfig.customPresets?.some(p => p.id === newId)) {
      // It's a custom one, add base generic variables
      setParams({ months: 3, containment: 0, margin: 0 })
    }
  }

  const handleParamChange = (key: keyof FormulaParams, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleApply = () => {
    startTransition(async () => {
      const newConfig: BudgetFormulaPreferences = {
        ...formulaConfig,
        global: { id: selectedId, params },
      }
      await saveBudgetFormula(newConfig)
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <Card className="@container/card h-full">
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4" />
          Configuração Global
        </CardDescription>
        <CardTitle className="text-lg font-semibold @[250px]/card:text-xl">
          Fórmulas
        </CardTitle>
        <CardAction>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              {isCustomDef ? "⚡ " + isCustomDef.name : definition?.icon + " " + definition?.name}
            </Badge>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* Formula Selector */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Abordagem</Label>
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
              <div className="flex gap-1">
                {isCustomDef && (
                  <>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => openCreator(isCustomDef)}
                      title="Editar Mecanismo"
                      disabled={isPending}
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={handleDeleteCustomPreset}
                      title="Excluir Mecanismo"
                      disabled={isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => openCreator()}
                  title="Novo Mecanismo"
                >
                  <span className="text-xl leading-none -mt-1">+</span>
                </Button>
              </div>
            </div>
            {definition && (
              <p className="text-xs text-muted-foreground">
                {definition.description}
              </p>
            )}
            {isCustomDef && (
              <p className="text-xs text-muted-foreground font-mono bg-muted/50 p-1 rounded">
                Expressão: {isCustomDef.expression}
              </p>
            )}
          </div>

          {/* Dynamic Variables */}
          {definition && (
            <div className="grid grid-cols-2 gap-3">
              {definition.variables.map((v: FormulaVariable) => (
                <div key={v.key} className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">
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
                <Label className="text-xs text-muted-foreground">Meses (Histórico)</Label>
                <Input type="number" min={1} max={24} value={params.months ?? 3} onChange={(e) => handleParamChange("months", parseFloat(e.target.value)||0)} className="tabular-nums font-mono text-sm h-9" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Contenção (%)</Label>
                <Input type="number" min={0} value={params.containment ?? 0} onChange={(e) => handleParamChange("containment", parseFloat(e.target.value)||0)} className="tabular-nums font-mono text-sm h-9" />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <Label className="text-xs text-muted-foreground">Margem Extra (%)</Label>
                <Input type="number" min={0} value={params.margin ?? 0} onChange={(e) => handleParamChange("margin", parseFloat(e.target.value)||0)} className="tabular-nums font-mono text-sm h-9" />
              </div>
            </div>
          )}

          {/* No history warning */}
          {!hasAnyHistory && (
            <div className="rounded-md border border-chart-4/30 bg-chart-4/10 px-3 py-2">
              <p className="text-xs text-chart-4">
                Sem histórico de gastos. Os dados serão incorporados ao cálculo
                à medida que houver movimentação.
              </p>
            </div>
          )}

          {/* Apply Button */}
          <Button
            onClick={handleApply}
            disabled={isPending || saved}
            className="w-full"
            size="sm"
          >
            {isPending ? (
              <span className="animate-pulse">Aplicando...</span>
            ) : saved ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Aplicado
              </>
            ) : (
              "Aplicar a todos"
            )}
          </Button>
        </div>
      </CardContent>
      <CreateCustomFormulaDialog 
        open={isCreatorOpen} 
        onOpenChange={setIsCreatorOpen} 
        formulaConfig={formulaConfig} 
        editPreset={editPreset}
      />
    </Card>
  )
}

"use client"

import { useState, useTransition } from "react"
import { Save, Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { saveBudgetFormula } from "../services/save-budget-formula"
import type { BudgetFormulaPreferences, CustomFormulaDefinition } from "../types"
import { randomUUID } from "crypto"
import { useRouter } from "next/navigation"

interface CreateCustomFormulaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formulaConfig: BudgetFormulaPreferences
  editPreset?: CustomFormulaDefinition
}

export function CreateCustomFormulaDialog({
  open,
  onOpenChange,
  formulaConfig,
  editPreset,
}: CreateCustomFormulaDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(editPreset?.name || "")
  const [expression, setExpression] = useState(editPreset?.expression || "")

  const handleSave = () => {
    if (!name.trim() || !expression.trim()) return

    startTransition(async () => {
      const newPreset: CustomFormulaDefinition = {
        id: "custom_" + Math.random().toString(36).substring(2, 9),
        name: name.trim(),
        expression: expression.trim().toUpperCase(),
      }

      const newConfig: BudgetFormulaPreferences = {
        ...formulaConfig,
        customPresets: editPreset 
          ? formulaConfig.customPresets?.map(p => p.id === editPreset.id ? newPreset : p)
          : [...(formulaConfig.customPresets || []), newPreset],
        global: {
          id: newPreset.id,
          params: { months: 3, containment: 0, margin: 0 }
        }
      }

      await saveBudgetFormula(newConfig)
      
      setName("")
      setExpression("")
      onOpenChange(false)
      router.refresh()
    })
  }

  const isValid = name.trim().length > 0 && expression.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Mecanismo Matemático</DialogTitle>
          <DialogDescription>
            Crie uma fórmula financeira inteligente para seus limites. Utilizando variáveis dinâmicas do histórico real.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Custom name */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Nome do Mecanismo *
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Teto Inflacionário"
            />
          </div>

          {/* Expression */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Expressão Matemática *
            </Label>
            <Textarea
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="Ex: ([MEDIA] + [DESVIO_P]) * 1.1"
              className="font-mono"
            />
            <div className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded flex flex-col gap-1 h-32 overflow-y-auto">
              <span className="font-semibold text-foreground mb-1">Biblioteca de Variáveis (Case-Insensitive):</span>
              <p><code>[MEDIA]</code>: Média dos gastos nos últimos meses.</p>
              <p><code>[MAX]</code>: Gasto máximo histórico.</p>
              <p><code>[MIN]</code>: Gasto mínimo histórico.</p>
              <p><code>[DESVIO_P]</code>: Desvio padrão do gasto.</p>
              <p><code>[ULTIMO]</code>: Valor fechado do mês anterior.</p>
              <p><code>[M_RECEITAS]</code>: Média total de receitas no período.</p>
              <p><code>[U_RECEITA]</code>: Receita do último mês.</p>
              <p><code>[CONTENCAO]</code>: Imput de contenção % da UI (ex: 5%).</p>
              <p><code>[MARGEM]</code>: Margem customizável.</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || !isValid}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Salvar Mecanismo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

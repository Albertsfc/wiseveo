"use client"

import { useState, useTransition, useMemo } from "react"
import { Save, Loader2 } from "lucide-react"
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
import { createBudgetItem } from "../services/create-budget-item"
import { saveCustomBudgetCard } from "../services/save-budget-formula"
import type { GroupWithCategories, BudgetItem } from "../types"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

const GROUP_EMOJI_MAP: Record<string, string> = {
  receitas: "💰",
  "habitação": "🏠",
  habitacao: "🏠",
  "alimentação": "🍔",
  alimentacao: "🍔",
  "saúde": "🏥",
  saude: "🏥",
  "educação": "🎓",
  educacao: "🎓",
  transporte: "🚗",
  "vestuário": "👕",
  vestuario: "👕",
  "serviços": "🛠️",
  servicos: "🛠️",
  lazer: "🎭",
  turismo: "✈️",
  pet: "🐾",
  impostos: "🏛️",
  "outras despesas": "📦",
  "caixa e captação": "💳",
  "caixa e captacao": "💳",
  financeira: "📊",
}

interface CreateBudgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: GroupWithCategories[]
  editItem?: BudgetItem
}

export function CreateBudgetDialog({
  open,
  onOpenChange,
  groups,
  editItem,
}: CreateBudgetDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Track default tab
  const defaultTab = editItem?.id.startsWith("custom_") ? "agregado" : "simples"
  
  const [selectedGroupId, setSelectedGroupId] = useState(editItem?.groupId || "")
  const [selectedCategoryId, setSelectedCategoryId] = useState(editItem?.categoryId || "")
  const [customName, setCustomName] = useState(editItem?.name === editItem?.originalName ? "" : (editItem?.name || ""))
  const [amount, setAmount] = useState(editItem?.amountSetting?.toString() || "")

  const [selectedMultiGroups, setSelectedMultiGroups] = useState<string[]>(editItem?.groupIds || [])
  const [selectedMultiCats, setSelectedMultiCats] = useState<string[]>(editItem?.categoryIds || [])

  // Override initial state when editItem changes or modal opens
  useMemo(() => {
    if (open) {
      if (editItem) {
        setSelectedGroupId(editItem.groupId || "")
        setSelectedCategoryId(editItem.categoryId || "")
        setCustomName(editItem.name === editItem.originalName ? "" : (editItem.name || ""))
        setAmount(editItem.amountSetting?.toString() || "")
        setSelectedMultiGroups(editItem.groupIds || [])
        setSelectedMultiCats(editItem.categoryIds || [])
      } else {
        setSelectedGroupId("")
        setSelectedCategoryId("")
        setCustomName("")
        setAmount("")
        setSelectedMultiGroups([])
        setSelectedMultiCats([])
      }
    }
  }, [open, editItem])

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId),
    [groups, selectedGroupId]
  )

  const groupEmoji = selectedGroup
    ? GROUP_EMOJI_MAP[selectedGroup.name.toLowerCase()] || "📁"
    : "📁"

  const handleGroupChange = (id: string) => {
    setSelectedGroupId(id)
    setSelectedCategoryId("")
  }

  const handleSave = () => {
    const numAmount = parseFloat(amount) || 0

    const isAggregated = selectedMultiGroups.length > 0 || selectedMultiCats.length > 0

    if (!isAggregated && !selectedGroupId) return

    startTransition(async () => {
      if (isAggregated) {
        await saveCustomBudgetCard({
          id: editItem?.id.startsWith("custom_") ? editItem.id : `custom_${Date.now()}`,
          name: customName.trim() || "Orçamento Personalizado",
          groupIds: selectedMultiGroups,
          categoryIds: selectedMultiCats,
          amount: numAmount
        })
      } else {
        await createBudgetItem({
          groupId: selectedGroupId,
          categoryId: selectedCategoryId && selectedCategoryId !== "none" ? selectedCategoryId : undefined,
          customName: customName.trim() || undefined,
          amount: numAmount,
        })
      }

      // Reset and close
      setSelectedGroupId("")
      setSelectedCategoryId("")
      setSelectedMultiGroups([])
      setSelectedMultiCats([])
      setCustomName("")
      setAmount("")
      onOpenChange(false)
      router.refresh()
    })
  }

  const isValid = (selectedGroupId || selectedMultiGroups.length > 0 || selectedMultiCats.length > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-lg">
              {selectedCategoryId ? "📌" : groupEmoji}
            </div>
            <div>
              <DialogTitle>{editItem ? "Editar Orçamento" : "Novo Orçamento"}</DialogTitle>
              <DialogDescription>
                {editItem ? "Altere as configurações do limite deste cartão" : "Vincule a um grupo ou categoria específica"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="w-full flex">
              <TabsTrigger value="simples" className="flex-1">Simples</TabsTrigger>
              <TabsTrigger value="agregado" className="flex-1">Agregado</TabsTrigger>
            </TabsList>

            <TabsContent value="simples" className="flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Grupo *
                </Label>
                <Select value={selectedGroupId} onValueChange={handleGroupChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um Grupo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        <span className="flex items-center gap-2">
                          <span>
                            {GROUP_EMOJI_MAP[g.name.toLowerCase()] || "📁"}
                          </span>
                          <span>{g.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Categoria (Opcional)
                </Label>
                <Select
                  value={selectedCategoryId}
                  onValueChange={setSelectedCategoryId}
                  disabled={!selectedGroup}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhuma (Orçamento do Grupo)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      Nenhuma (Orçamento do Grupo)
                    </SelectItem>
                    {selectedGroup?.categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        📌 {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="agregado" className="flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Selecione os Componentes *
                </Label>
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  <div className="flex flex-col gap-4">
                    {groups.map((g) => (
                      <div key={g.id} className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id={`grp-${g.id}`}
                            checked={selectedMultiGroups.includes(g.id)}
                            onCheckedChange={(checked) => {
                              if (checked) setSelectedMultiGroups(prev => [...prev, g.id])
                              else setSelectedMultiGroups(prev => prev.filter(id => id !== g.id))
                            }}
                          />
                          <Label htmlFor={`grp-${g.id}`} className="font-semibold text-sm">
                            {GROUP_EMOJI_MAP[g.name.toLowerCase()] || "📁"} {g.name}
                          </Label>
                        </div>
                        <div className="flex flex-col gap-2 pl-6">
                          {g.categories.map((c) => (
                            <div key={c.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`cat-${c.id}`}
                                checked={selectedMultiCats.includes(c.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) setSelectedMultiCats(prev => [...prev, c.id])
                                  else setSelectedMultiCats(prev => prev.filter(id => id !== c.id))
                                }}
                              />
                              <Label htmlFor={`cat-${c.id}`} className="text-sm font-normal text-muted-foreground cursor-pointer">
                                📌 {c.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>

          {/* Removed Categories single select since it's in Tabs */}

          {/* Custom name */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Apelido do Cartão (Opcional)
            </Label>
            <Input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Ex: Viagem Férias"
            />
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Teto Mensal (Opcional)
            </Label>
            <div className="relative">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00 (Usado caso a fórmula seja Alvo Fixo)"
                className="tabular-nums font-mono font-normal text-sm"
                min={0}
                step={50}
              />
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
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

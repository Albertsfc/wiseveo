import { Plus } from "lucide-react"

import {
  Card,
  CardContent,
} from "@/components/ui/card"

export function AddAccountCard() {
  return (
    <Card className="border-dashed bg-muted/20 shadow-none cursor-pointer transition-all hover:bg-muted/30 hover:border-primary/30">
      <CardContent className="flex flex-1 flex-col items-center justify-center gap-4 min-h-[180px]">
        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
          <Plus className="size-6" />
        </div>
        <span className="text-sm font-semibold text-muted-foreground">
          Adicionar Conta
        </span>
      </CardContent>
    </Card>
  )
}

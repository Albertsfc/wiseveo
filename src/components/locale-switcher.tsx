"use client"

import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe } from "lucide-react"

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()

  const handleValueChange = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={locale} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[120px] h-8 text-xs">
          <SelectValue placeholder="Idioma" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pt-BR">Português (BR)</SelectItem>
          <SelectItem value="en-US">English (US)</SelectItem>
          <SelectItem value="es-AM">Español (AM)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

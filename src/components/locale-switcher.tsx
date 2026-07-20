"use client"

import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe } from "lucide-react"
import { LOCALES, LOCALE_META } from "@/i18n/config"

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()

  const handleValueChange = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`
    // Fire-and-forget: persist the locale to the user record too, so
    // cookie-less channels (Telegram, background jobs) also pick it up.
    // Don't block the cookie-driven refresh below on this.
    fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: newLocale }),
    }).catch(() => {})
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
          {LOCALES.map((code) => (
            <SelectItem key={code} value={code}>
              {LOCALE_META[code].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

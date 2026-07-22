"use client"

import { Check } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LOCALES, LOCALE_META, resolveAppLocale } from "@/i18n/config"
import { applyUserLocale } from "@/components/locale-switcher"

/**
 * Seletor compacto de idioma para a topbar: gatilho só com a bandeira do
 * idioma ativo; itens com bandeira + nome nativo. Mesma persistência do
 * LocaleSwitcher de Configurações (cookie + PATCH no perfil).
 */
export function LocaleMenu() {
  const locale = resolveAppLocale(useLocale())
  const router = useRouter()
  const t = useTranslations("common")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="cursor-pointer">
          <span aria-hidden className="text-base leading-none">
            {LOCALE_META[locale].flag}
          </span>
          <span className="sr-only">{t("changeLanguage")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {LOCALES.map((code) => (
          <DropdownMenuItem
            key={code}
            className="cursor-pointer gap-2"
            onSelect={() => {
              if (code !== locale) {
                applyUserLocale(code)
                router.refresh()
              }
            }}
          >
            <span aria-hidden className="text-base leading-none">
              {LOCALE_META[code].flag}
            </span>
            <span className="flex-1">{LOCALE_META[code].label}</span>
            {code === locale && <Check className="size-4 text-muted-foreground" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

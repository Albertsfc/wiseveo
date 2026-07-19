"use client"

import { useEffect } from "react"
import { useLocale } from "next-intl"
import * as z from "zod"
import { resolveAppLocale } from "@/i18n/config"

const APPLY = {
  "pt-BR": () => z.config(z.locales.pt()),
  "en-US": () => z.config(z.locales.en()),
  "es-419": () => z.config(z.locales.es()),
} as const

export function ZodLocaleSync() {
  const locale = useLocale()
  useEffect(() => {
    APPLY[resolveAppLocale(locale)]()
  }, [locale])
  return null
}

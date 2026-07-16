import { ptBR, enUS, es } from "date-fns/locale"
import type { Locale as DateFnsLocale } from "date-fns"

export const LOCALES = ["pt-BR", "en-US", "es-419"] as const
export type AppLocale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: AppLocale = "pt-BR"

interface LocaleMeta {
  /** Tag BCP-47 válida para <html lang>, Intl.* e navegador. */
  intlLocale: string
  dateFnsLocale: DateFnsLocale
  label: string
  flag: string
}

export const LOCALE_META: Record<AppLocale, LocaleMeta> = {
  "pt-BR": { intlLocale: "pt-BR", dateFnsLocale: ptBR, label: "Português (BR)", flag: "🇧🇷" },
  "en-US": { intlLocale: "en-US", dateFnsLocale: enUS, label: "English (US)", flag: "🇺🇸" },
  "es-419": { intlLocale: "es-419", dateFnsLocale: es, label: "Español (LatAm)", flag: "🌎" },
}

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value)
}

export function resolveAppLocale(value: unknown): AppLocale {
  return isAppLocale(value) ? value : DEFAULT_LOCALE
}

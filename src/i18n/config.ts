export const LOCALES = ["pt-BR", "en-US", "es-419"] as const
export type AppLocale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: AppLocale = "pt-BR"

interface LocaleMeta {
  /** Tag BCP-47 usada em <html lang> e Intl.*; ponto único de indireção caso um ID interno volte a divergir da tag de formatação. */
  intlLocale: string
  label: string
  /** Caminho da bandeira circular em public/flags (conjunto completo em
   *  public/flags — HatScripts/circle-flags, MIT — para idiomas futuros). */
  flagSrc: string
}

// i18n-ignore: nomes nativos dos idiomas — sempre exibidos no próprio idioma, nunca traduzidos.
export const LOCALE_META: Record<AppLocale, LocaleMeta> = {
  "pt-BR": { intlLocale: "pt-BR", label: "Português (BR)", flagSrc: "/flags/br.svg" }, // i18n-ignore
  "en-US": { intlLocale: "en-US", label: "English (US)", flagSrc: "/flags/us.svg" },
  "es-419": { intlLocale: "es-419", label: "Español (ES)", flagSrc: "/flags/es.svg" }, // i18n-ignore
}

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value)
}

export function resolveAppLocale(value: unknown): AppLocale {
  return isAppLocale(value) ? value : DEFAULT_LOCALE
}

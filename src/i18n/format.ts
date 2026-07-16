import { format as dateFnsFormat } from "date-fns"
import { LOCALE_META, resolveAppLocale } from "./config"

export function getIntlLocale(locale: string | null | undefined): string {
  return LOCALE_META[resolveAppLocale(locale)].intlLocale
}

export function getDateFnsLocale(locale: string | null | undefined) {
  return LOCALE_META[resolveAppLocale(locale)].dateFnsLocale
}

/** Substituto padrão de format(date, pattern, { locale: ptBR }) */
export function formatAppDate(date: Date | number, pattern: string, locale: string | null | undefined): string {
  return dateFnsFormat(date, pattern, { locale: getDateFnsLocale(locale) })
}

/** Substituto padrão de new Intl.DateTimeFormat("pt-BR", options) */
export function createDateFormatter(
  locale: string | null | undefined,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(getIntlLocale(locale), options)
}

/** Números NÃO monetários que seguem o idioma da UI (monetários continuam em lib/monetary.ts). */
export function createNumberFormatter(
  locale: string | null | undefined,
  options: Intl.NumberFormatOptions = {},
): Intl.NumberFormat {
  return new Intl.NumberFormat(getIntlLocale(locale), options)
}

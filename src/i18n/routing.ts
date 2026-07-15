import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
  locales: ["pt-BR", "en-US", "es-AM"],
  defaultLocale: "pt-BR",
  localePrefix: "never", // No locale prefixes in URLs
})

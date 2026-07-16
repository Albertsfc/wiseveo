import type ptBR from "./messages/pt-BR.json"
import type { LOCALES } from "./config"

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof LOCALES)[number]
    Messages: typeof ptBR
  }
}

import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"
import { routing } from "./routing"

export default getRequestConfig(async () => {
  // Extract locale from cookie, fallback to default
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value

  const locale = routing.locales.includes(localeCookie as any)
    ? localeCookie
    : routing.defaultLocale

  return {
    locale: locale || "pt-BR",
    messages: (await import(`./messages/${locale || "pt-BR"}.json`)).default
  }
})

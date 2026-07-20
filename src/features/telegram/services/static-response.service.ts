import { buildGreetingResponse, detectGreeting } from "./greeting-detector"
import type { TelegramUserContext } from "./user-context.service"
import type { TelegramTranslator } from "../types/telegram.types"

// Detection regexes only recognize Portuguese phrasing (data, not UI copy).
// For non pt-BR users these simply won't match and the query falls through
// to the LLM classifier instead — an acceptable, intentional degradation.
const WEATHER_REGEX =
  /\b(chov(?:er|eu|endo|e)?|chuva|tempo|meteorologia|previs[aã]o\s+do\s+tempo|clima)\b/i

const IDENTITY_REGEX =
  /^(quem\s+sou\s+eu|qual\s+(?:e|é)\s+meu\s+nome|meu\s+nome|qual\s+(?:e|é)\s+meu\s+e-?mail|meu\s+e-?mail|com\s+qual\s+usu[aá]rio\s+estou\s+conectado)[\s?!.]*$/i

export function buildStaticResponse(
  text: string,
  context: TelegramUserContext,
  t: TelegramTranslator,
): { response: string; kind: "greeting" | "identity" | "out_of_scope" } | null {
  const trimmed = text.trim()

  if (detectGreeting(trimmed)) {
    return {
      kind: "greeting",
      response: buildGreetingResponse(trimmed, context.firstName, t),
    }
  }

  if (IDENTITY_REGEX.test(trimmed)) {
    return {
      kind: "identity",
      response: t("staticResponses.identity", { name: context.name, email: context.email }),
    }
  }

  if (WEATHER_REGEX.test(trimmed)) {
    return {
      kind: "out_of_scope",
      response: t("staticResponses.outOfScopeWeather"),
    }
  }

  return null
}

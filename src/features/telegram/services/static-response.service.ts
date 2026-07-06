import { buildGreetingResponse, detectGreeting } from "./greeting-detector"
import type { TelegramUserContext } from "./user-context.service"

const WEATHER_REGEX =
  /\b(chov(?:er|eu|endo|e)?|chuva|tempo|meteorologia|previs[aã]o\s+do\s+tempo|clima)\b/i

const IDENTITY_REGEX =
  /^(quem\s+sou\s+eu|qual\s+(?:e|é)\s+meu\s+nome|meu\s+nome|qual\s+(?:e|é)\s+meu\s+e-?mail|meu\s+e-?mail|com\s+qual\s+usu[aá]rio\s+estou\s+conectado)[\s?!.]*$/i

export function buildStaticResponse(
  text: string,
  context: TelegramUserContext,
): { response: string; kind: "greeting" | "identity" | "out_of_scope" } | null {
  const trimmed = text.trim()

  if (detectGreeting(trimmed)) {
    return {
      kind: "greeting",
      response: buildGreetingResponse(trimmed, context.firstName),
    }
  }

  if (IDENTITY_REGEX.test(trimmed)) {
    return {
      kind: "identity",
      response: `Você está conectado como ${context.name} (${context.email}).`,
    }
  }

  if (WEATHER_REGEX.test(trimmed)) {
    return {
      kind: "out_of_scope",
      response:
        "Desculpe, não respondo assuntos de meteorologia. Posso ajudar com suas finanças no WISEVEO.",
    }
  }

  return null
}

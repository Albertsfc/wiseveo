import type { TelegramTranslator } from "../types/telegram.types"

// Detection keyword list (pt/en greeting words) — data used to recognize an
// incoming greeting regardless of the user's UI locale, not UI copy itself.
// Regex literals are never scanned by check-hardcoded-strings.ts, so no
// i18n-ignore marker is needed here.
const GREETING_REGEX =
  /^(olá|ola|oi+|oie|hello|hi+|hey|bom\s+dia|boa\s+tarde|boa\s+noite|good\s+morning|good\s+evening|good\s+night|e\s+a[ií]|eai|tudo\s+bem|tudo\s+bom|opa|salve|boas|fala)[\s!.,?]*$/i

export function detectGreeting(text: string): boolean {
  return GREETING_REGEX.test(text.trim())
}

export function buildGreetingResponse(message: string, firstName: string, t: TelegramTranslator): string {
  const msg = message.toLowerCase().trim()
  let salutation: string

  if (/bom\s+dia/i.test(msg)) salutation = t("greetings.morning")
  else if (/boa\s+tarde/i.test(msg)) salutation = t("greetings.afternoon")
  else if (/boa\s+noite/i.test(msg)) salutation = t("greetings.evening")
  else {
    const hour = new Date().getHours()
    salutation = hour < 12 ? t("greetings.morning") : hour < 18 ? t("greetings.afternoon") : t("greetings.evening")
  }

  const prompt = t("greetings.helpPrompt")

  return firstName
    ? t("greetings.withName", { salutation, name: firstName, prompt })
    : t("greetings.withoutName", { salutation, prompt })
}

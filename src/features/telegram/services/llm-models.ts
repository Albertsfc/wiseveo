import { createOpenAI } from "@ai-sdk/openai"
import type { LanguageModel } from "ai"

export const TELEGRAM_OPENAI_MODEL = "gpt-4o-mini"

export function getLlmModels(): LanguageModel[] {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for the Telegram AI module")
  }

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })

  return [openai(TELEGRAM_OPENAI_MODEL)]
}

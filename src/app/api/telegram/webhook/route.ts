import { NextResponse } from "next/server"
import { getTelegramBot } from "@/features/telegram/services/bot.service"
import { handleTelegramUpdate } from "@/features/telegram/services/message-handler.service"
import type { TelegramWebhookUpdate } from "@/features/telegram/types/telegram.types"

export async function POST(req: Request) {
  try {
    getTelegramBot()
  } catch {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not configured" }, { status: 500 })
  }

  const secret = req.headers.get("x-telegram-bot-api-secret-token")
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  let update: TelegramWebhookUpdate
  try {
    update = (await req.json()) as TelegramWebhookUpdate
  } catch {
    // i18n-ignore: webhook chamado pelos servidores do Telegram, não por um usuário via UI
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  await handleTelegramUpdate(update)

  return NextResponse.json({ ok: true })
}

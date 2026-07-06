import TelegramBot from "node-telegram-bot-api"
import type { TelegramChatId } from "../types/telegram.types"

let cachedBot: TelegramBot | null = null

export function getTelegramBot() {
  if (cachedBot) return cachedBot

  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN not configured")
  }

  cachedBot = new TelegramBot(token, { polling: false })
  return cachedBot
}

export async function sendTelegramMessage(chatId: TelegramChatId, text: string) {
  await getTelegramBot().sendMessage(chatId, text)
}

export async function sendTelegramPhoto(chatId: TelegramChatId, image: Buffer, caption?: string) {
  await getTelegramBot().sendPhoto(chatId, image, caption ? { caption } : undefined)
}

export async function sendTelegramChatAction(chatId: TelegramChatId, action: "typing" | "upload_photo") {
  await getTelegramBot().sendChatAction(chatId, action)
}

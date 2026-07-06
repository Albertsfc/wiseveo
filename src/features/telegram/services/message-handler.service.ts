import { prisma } from "@/lib/prisma"
import { generateCardImage } from "./card-renderer.service"
import {
  sendTelegramChatAction,
  sendTelegramMessage,
  sendTelegramPhoto,
} from "./bot.service"
import { getConversationMemory, recordTelegramInteraction } from "./conversation-history.service"
import { classifyQuery } from "./query-classifier.service"
import { dispatchQuery } from "./tool-dispatcher.service"
import { formatCard } from "./card-formatter.service"
import { generateAnalystResponse } from "./analyst-response.service"
import { buildStaticResponse } from "./static-response.service"
import { buildTelegramUserContext } from "./user-context.service"
import type { TelegramChatId, TelegramWebhookUpdate } from "../types/telegram.types"

function getStartToken(text: string) {
  const match = /^\/start\s+(.+)$/i.exec(text.trim())
  return match?.[1]?.trim() ?? null
}

async function handleStartConnection(input: {
  chatId: TelegramChatId
  token: string
  username: string | null
}) {
  const pending = await prisma.telegramPendingToken.findUnique({
    where: { token: input.token },
  })

  if (!pending || pending.used || pending.expiresAt <= new Date()) {
    await sendTelegramMessage(
      input.chatId,
      "Link de conexao invalido ou expirado. Gere um novo no painel de configuracoes.",
    )
    return
  }

  await prisma.telegramConnection.upsert({
    where: { userId: pending.userId },
    create: {
      userId: pending.userId,
      telegramChatId: BigInt(input.chatId),
      telegramUsername: input.username,
    },
    update: {
      telegramChatId: BigInt(input.chatId),
      telegramUsername: input.username,
      isActive: true,
    },
  })

  await prisma.telegramPendingToken.update({
    where: { token: input.token },
    data: { used: true },
  })

  await sendTelegramMessage(
    input.chatId,
    "Conta WISEVEO conectada com sucesso. Voce ja pode me fazer perguntas sobre suas financas.",
  )
}

async function handleFinancialQuestion(chatId: TelegramChatId, text: string) {
  const connection = await prisma.telegramConnection.findUnique({
    where: { telegramChatId: BigInt(chatId) },
    include: { user: { select: { name: true, email: true, preferencesJson: true } } },
  })

  if (!connection || !connection.isActive) {
    await sendTelegramMessage(
      chatId,
      "Voce precisa conectar sua conta WISEVEO primeiro acessando as Configuracoes do painel.",
    )
    return
  }

  const chatKey = String(chatId)
  const userContext = buildTelegramUserContext({
    userId: connection.userId,
    user: connection.user,
  })

  const staticResponse = buildStaticResponse(text, userContext)
  if (staticResponse) {
    await sendTelegramMessage(chatId, staticResponse.response)
    await recordTelegramInteraction({
      chatId: chatKey,
      userId: connection.userId,
      userText: text,
      assistantText: staticResponse.response,
    })
    return
  }

  await sendTelegramChatAction(chatId, "typing")

  const memory = await getConversationMemory({ chatId: chatKey, userId: connection.userId })
  const history = memory.recentMessages

  const classified = await classifyQuery(text, history, memory)

  if (classified.intent === "unknown") {
    const response =
      "Não conectei sua pergunta às finanças do WISEVEO. Posso ajudar com lançamentos, saldos, orçamento, DRE e vencimentos."
    await sendTelegramMessage(chatId, response)
    await recordTelegramInteraction({
      chatId: chatKey,
      userId: connection.userId,
      userText: text,
      assistantText: response,
      classified,
    })
    return
  }

  const dispatched = await dispatchQuery(connection.userId, classified)

  if (classified.intent === "financial_analysis") {
    await sendTelegramChatAction(chatId, "typing")
    const analysisText = await generateAnalystResponse(text, classified, dispatched)
    await sendTelegramMessage(chatId, analysisText)
    await recordTelegramInteraction({
      chatId: chatKey,
      userId: connection.userId,
      userText: text,
      assistantText: analysisText,
      classified,
    })
    return
  }

  const cardData = await formatCard(text, classified, dispatched)

  if (cardData.type === "error") {
    const response = cardData.insight ?? "Desculpe, não consegui processar sua solicitação no momento."
    await sendTelegramMessage(chatId, response)
    await recordTelegramInteraction({
      chatId: chatKey,
      userId: connection.userId,
      userText: text,
      assistantText: response,
      classified,
    })
    return
  }

  await recordTelegramInteraction({
    chatId: chatKey,
    userId: connection.userId,
    userText: text,
    assistantText: cardData.insight ?? `${cardData.headline}: ${cardData.value ?? ""}`.trim(),
    classified,
  })

  await sendTelegramChatAction(chatId, "upload_photo")
  const imageBuffer = await generateCardImage(cardData)
  await sendTelegramPhoto(chatId, imageBuffer, cardData.insight)
}

export async function handleTelegramUpdate(update: TelegramWebhookUpdate) {
  const message = update.message
  if (!message?.text) return

  const text = message.text.trim()
  const chatId = message.chat.id
  const startToken = getStartToken(text)

  if (startToken) {
    await handleStartConnection({
      chatId,
      token: startToken,
      username: message.from?.username ?? null,
    })
    return
  }

  try {
    await handleFinancialQuestion(chatId, text)
  } catch (error) {
    console.error("Telegram message processing error", error)
    await sendTelegramMessage(chatId, "Desculpe, ocorreu um erro tecnico ao processar sua pergunta.")
  }
}

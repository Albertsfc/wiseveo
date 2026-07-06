import { Prisma } from "@/generated/prisma_new/client"
import { prisma } from "@/lib/prisma"
import type { ClassifiedQuery } from "./query-classifier.service"

export interface HistoryMessage {
  role: "user" | "assistant"
  content: string
}

export interface TelegramConversationMemoryState {
  recentMessages: HistoryMessage[]
  lastIntent?: string
  lastPeriod?: { from: string; to: string }
  lastFilters?: {
    searchText?: string
    groupName?: string
    categoryName?: string
    accountName?: string
    transactionType?: string
    status?: string
  }
  lastTransactionQuestion?: string
  updatedAt?: string
}

const MAX_HISTORY = 8

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function normalizeHistoryMessage(value: unknown): HistoryMessage | null {
  if (!isRecord(value)) return null
  const role = value.role === "user" || value.role === "assistant" ? value.role : null
  const content = typeof value.content === "string" ? value.content : null
  if (!role || !content) return null
  return { role, content }
}

function normalizeMemory(value: unknown): TelegramConversationMemoryState {
  if (!isRecord(value)) return { recentMessages: [] }

  const recentMessages = Array.isArray(value.recentMessages)
    ? value.recentMessages.map(normalizeHistoryMessage).filter((m): m is HistoryMessage => Boolean(m))
    : []

  const lastPeriod = isRecord(value.lastPeriod)
    && typeof value.lastPeriod.from === "string"
    && typeof value.lastPeriod.to === "string"
    ? { from: value.lastPeriod.from, to: value.lastPeriod.to }
    : undefined

  const lastFilters = isRecord(value.lastFilters)
    ? {
        searchText: typeof value.lastFilters.searchText === "string" ? value.lastFilters.searchText : undefined,
        groupName: typeof value.lastFilters.groupName === "string" ? value.lastFilters.groupName : undefined,
        categoryName: typeof value.lastFilters.categoryName === "string" ? value.lastFilters.categoryName : undefined,
        accountName: typeof value.lastFilters.accountName === "string" ? value.lastFilters.accountName : undefined,
        transactionType:
          typeof value.lastFilters.transactionType === "string"
            ? value.lastFilters.transactionType
            : undefined,
        status: typeof value.lastFilters.status === "string" ? value.lastFilters.status : undefined,
      }
    : undefined

  return {
    recentMessages: recentMessages.slice(-MAX_HISTORY),
    lastIntent: typeof value.lastIntent === "string" ? value.lastIntent : undefined,
    lastPeriod,
    lastFilters,
    lastTransactionQuestion:
      typeof value.lastTransactionQuestion === "string" ? value.lastTransactionQuestion : undefined,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : undefined,
  }
}

async function readMemoryRecord(input: {
  chatId: string
  userId: string
}): Promise<TelegramConversationMemoryState> {
  const chatId = BigInt(input.chatId)
  try {
    const record = await prisma.telegramConversationMemory.upsert({
      where: { telegramChatId: chatId },
      create: {
        userId: input.userId,
        telegramChatId: chatId,
        memoryJson: toInputJsonValue({ recentMessages: [] }),
      },
      update: {
        userId: input.userId,
      },
      select: { memoryJson: true },
    })

    return normalizeMemory(record.memoryJson)
  } catch (error) {
    console.warn("Telegram memory read failed; continuing without persisted memory.", error)
    return { recentMessages: [] }
  }
}

async function writeMemoryRecord(input: {
  chatId: string
  userId: string
  memory: TelegramConversationMemoryState
}) {
  const chatId = BigInt(input.chatId)
  try {
    await prisma.telegramConversationMemory.upsert({
      where: { telegramChatId: chatId },
      create: {
        userId: input.userId,
        telegramChatId: chatId,
        memoryJson: toInputJsonValue(input.memory),
      },
      update: {
        userId: input.userId,
        memoryJson: toInputJsonValue(input.memory),
      },
    })
  } catch (error) {
    console.warn("Telegram memory write failed; interaction will continue without persistence.", error)
  }
}

function extractFilters(classified: ClassifiedQuery) {
  return {
    searchText: classified.searchText,
    groupName: classified.groupName,
    categoryName: classified.categoryName,
    accountName: classified.accountName,
    transactionType: classified.transactionType,
    status: classified.status,
  }
}

export async function getConversationMemory(input: {
  chatId: string
  userId: string
}): Promise<TelegramConversationMemoryState> {
  return readMemoryRecord(input)
}

export async function getHistory(chatId: string, userId: string): Promise<HistoryMessage[]> {
  const memory = await readMemoryRecord({ chatId, userId })
  return memory.recentMessages
}

export async function recordTelegramInteraction(input: {
  chatId: string
  userId: string
  userText: string
  assistantText: string
  classified?: ClassifiedQuery
}) {
  const memory = await readMemoryRecord({ chatId: input.chatId, userId: input.userId })
  const recentMessages = [
    ...memory.recentMessages,
    { role: "user" as const, content: input.userText },
    { role: "assistant" as const, content: input.assistantText },
  ].slice(-MAX_HISTORY)

  const nextMemory: TelegramConversationMemoryState = {
    ...memory,
    recentMessages,
    updatedAt: new Date().toISOString(),
  }

  if (input.classified) {
    nextMemory.lastIntent = input.classified.intent
    nextMemory.lastPeriod = input.classified.period ?? memory.lastPeriod
    nextMemory.lastFilters = extractFilters(input.classified)

    if (input.classified.intent === "transaction_search" || input.classified.intent === "transaction_list") {
      nextMemory.lastTransactionQuestion = input.userText
    }
  }

  await writeMemoryRecord({ chatId: input.chatId, userId: input.userId, memory: nextMemory })
}

export async function clearHistory(chatId: string, userId: string): Promise<void> {
  await writeMemoryRecord({
    chatId,
    userId,
    memory: {
      recentMessages: [],
      updatedAt: new Date().toISOString(),
    },
  })
}

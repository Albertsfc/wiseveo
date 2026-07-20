import { generateText } from "ai"
import { getLlmModels } from "./llm-models"
import { LOCALE_META, type AppLocale } from "@/i18n/config"
import type { ClassifiedQuery } from "./query-classifier.service"
import type { DispatchResult } from "./tool-dispatcher.service"
import type { CardData, TelegramTranslator } from "../types/telegram.types"
import type { TransactionSearchResult } from "./transaction-search.service"

function parseCardData(text: string, t: TelegramTranslator): CardData {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return { type: "error", headline: t("cards.couldNotAnswer"), insight: t("cardFormatter.parseError") }
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Partial<CardData>
    const validTypes = ["summary", "list", "category", "comparison", "single-value", "error"]
    const type = validTypes.includes(parsed.type ?? "") ? parsed.type! : "summary"

    return {
      type,
      eyebrow: parsed.eyebrow,
      headline: parsed.headline || "WISEVEO",
      value: parsed.value,
      trend: parsed.trend,
      insight: parsed.insight,
      progress: parsed.progress,
      items: parsed.items?.slice(0, 5).map((item) => ({
        label: item.label,
        value: item.value,
        detail: item.detail,
        progress: item.progress,
        tone: item.tone,
      })),
    }
  } catch {
    return { type: "error", headline: t("cards.couldNotAnswer"), insight: t("cardFormatter.processError") }
  }
}

function isTransactionSearchResult(value: unknown): value is TransactionSearchResult {
  return value !== null && typeof value === "object" && "totalCount" in value && "items" in value
}

function pickTransactionSearchLabel(item: TransactionSearchResult["items"][number]) {
  return item.description?.trim() || item.note?.trim() || item.reference?.trim() || item.categoryName
}

const TRANSACTION_LIST_CARD_ITEM_LIMIT = 4
const DETAIL_QUERY_RE =
  /\b(?:detalh(?:e|es|ar|ado|ada|ados|adas)|listar|liste|lista|mostre|mostrar|exibir|exiba|quais|transa[cç][aã]o|transa[cç][oõ]es|lan[cç]amento|lan[cç]amentos|extrato)\b/i

function transactionHeadlineBase(data: TransactionSearchResult, t: TelegramTranslator) {
  return data.filters.transactionType === "EXPENSE"
    ? t("cardFormatter.expenses")
    : data.filters.transactionType === "INCOME"
      ? t("cardFormatter.income")
      : t("cardFormatter.transactions")
}

function transactionTermSuffix(data: TransactionSearchResult) {
  return data.filters.searchText ? `: ${data.filters.searchText}` : ""
}

function formatTransactionCount(count: number, t: TelegramTranslator) {
  return t("cardFormatter.transactionsCount", { count })
}

function shouldShowTransactionDetails(query: string) {
  return DETAIL_QUERY_RE.test(query)
}

function formatTransactionSearchSummaryCard(data: TransactionSearchResult, t: TelegramTranslator): CardData {
  const items: CardData["items"] = []

  // Add top categories if multiple categories matched
  if (data.aggregates.byCategory.length > 1) {
    data.aggregates.byCategory.slice(0, 2).forEach((cat) => {
      items.push({
        label: cat.name,
        value: cat.formattedTotal,
        detail: t("cardFormatter.transactionsAbbrev", { count: cat.count }),
        tone: cat.formattedTotal.startsWith("(") ? "negative" : "positive",
      })
    })
  }

  // Add top accounts
  data.aggregates.byAccount.slice(0, items.length > 0 ? 1 : 2).forEach((acc) => {
    items.push({
      label: acc.name,
      value: acc.formattedTotal,
      detail: t("cardFormatter.bankBalance"),
      tone: "default",
    })
  })

  // Fallback if no items
  if (items.length === 0) {
    items.push({
      label: t("cardFormatter.quantity"),
      value: formatTransactionCount(data.totalCount, t),
      tone: "default",
    })
  }

  return {
    type: "summary",
    eyebrow: data.period.label,
    headline: `${transactionHeadlineBase(data, t)}${transactionTermSuffix(data)}`,
    value: data.formattedTotal,
    insight: t("cardFormatter.totalInPeriod", {
      total: data.formattedTotal,
      countLabel: formatTransactionCount(data.totalCount, t),
    }),
    items: items.slice(0, 3),
  }
}

function formatTransactionSearchListCard(data: TransactionSearchResult, t: TelegramTranslator): CardData {
  const items = data.items.slice(0, TRANSACTION_LIST_CARD_ITEM_LIMIT)
  const moreInfo =
    data.totalCount > items.length
      ? t("cardFormatter.showingCount", { shown: items.length, total: data.totalCount })
      : ""

  return {
    type: "list",
    eyebrow: data.period.label,
    headline: `${transactionHeadlineBase(data, t)}${transactionTermSuffix(data)}`,
    value: data.formattedTotal,
    insight: `${t("cardFormatter.totalInPeriod", {
      total: data.formattedTotal,
      countLabel: formatTransactionCount(data.totalCount, t),
    })}${moreInfo}`,
    items: items.map((item) => ({
      label: pickTransactionSearchLabel(item),
      value: item.formattedAmount,
      detail: `${item.formattedDate} · ${item.categoryName} · ${item.accountName}`,
      tone: item.formattedAmount.startsWith("(") ? "negative" : "positive",
    })),
  }
}

function formatTransactionSearchCard(query: string, data: TransactionSearchResult, t: TelegramTranslator): CardData {
  if (data.totalCount === 0) {
    return {
      type: "error",
      headline: t("cardFormatter.notFound"),
      insight: data.noMatchesMessage ?? t("cardFormatter.noMatchesFallback"),
    }
  }

  return shouldShowTransactionDetails(query)
    ? formatTransactionSearchListCard(data, t)
    : formatTransactionSearchSummaryCard(data, t)
}

export async function formatCard(
  originalQuery: string,
  classified: ClassifiedQuery,
  dispatched: DispatchResult,
  t: TelegramTranslator,
  locale: AppLocale,
): Promise<CardData> {
  if (dispatched.intent === "transaction_search" && isTransactionSearchResult(dispatched.data)) {
    return formatTransactionSearchCard(originalQuery, dispatched.data, t)
  }

  // System prompt below is an LLM instruction (content, not UI copy) — the
  // examples stay in Portuguese as format illustrations; the actual output
  // language is enforced by the explicit directive at the end. i18n-ignore
  const systemPrompt = `Você é um formatador de cards financeiros de ALTA PERFORMANCE para o bot Telegram do WISEVEO.
Sua missão é transformar dados crus em cards elegantes, inteligentes e úteis.

FORMATO JSON:
{
  "type": "summary"|"list"|"category"|"single-value"|"error",
  "eyebrow": "período ou contexto curto (ex: Janeiro 2026)",
  "headline": "título descritivo curto e elegante",
  "value": "valor principal formatado (use campos formatted*)",
  "trend": "texto curto de tendência ou comparativo (opcional)",
  "insight": "DICA: Um insight curto e inteligente sobre os dados (ex: 'Representa 12% da sua renda', '3 ida(s) ao mercado este mês')",
  "items": [{"label":"...","value":"...","detail":"...","tone":"positive"|"negative"|"default"|"warning"}]
}

REGRAS DE OURO:
1. VALORES: Use EXATAMENTE os campos formatted* dos dados. NUNCA invente ou recalcule números.
2. INSIGHT: Não apenas repita o total. Tente encontrar um padrão ou dado interessante (ex: "Sua maior despesa foi no Banco X", "Média de R$ Y por lançamento").
3. TONS: Use "negative" para gastos/saídas e "positive" para ganhos/entradas.
4. ITEMS: Máximo 5 itens. Priorize os mais relevantes.

ORIENTAÇÕES POR TIPO:
- spending_by_payee → Destaque os maiores beneficiários. No insight, mencione o maior de todos.
- account_balance → Mostre os saldos. No insight, comente sobre a liquidez total.
- budget → No insight, diga se o usuário está perto de estourar ou se está economizando.
- transaction_search → Use os agregados (byCategory, byAccount) para mostrar onde o dinheiro está circulando.

Intenção: ${dispatched.intent}
Pergunta: "${originalQuery}"

Responda SEMPRE em ${LOCALE_META[locale].label} (idioma do usuário) — inclusive headline, eyebrow, trend, insight e labels dos items.`

  const dataStr = JSON.stringify(dispatched.data, null, 2)
  const models = getLlmModels()
  let lastError: unknown

  for (const model of models) {
    try {
      const result = await generateText({
        model,
        system: systemPrompt,
        prompt: `Dados:\n${dataStr}`,
        maxOutputTokens: 600,
      })
      return parseCardData(result.text, t)
    } catch (e) {
      lastError = e
      console.warn("Card formatter model failed, trying next:", e)
    }
  }

  console.error("Card formatter failed:", lastError)
  return { type: "error", headline: t("cards.couldNotAnswer"), insight: t("cardFormatter.parseError") }
}

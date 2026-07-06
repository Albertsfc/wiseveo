import { tool } from "ai"
import { z } from "zod"
import { getLatestTransactions } from "@/features/dashboard/services/get-latest-transactions"
import { clampToolLimit, formatMoney, resolveToolRange } from "./tool-utils"

export function createLatestTransactionsTool(userId: string) {
  return tool({
    description:
      "Lista os ultimos lancamentos pagos no periodo. Use para perguntas sobre pagamentos recentes, ultimas despesas quitadas ou entradas recebidas.",
    inputSchema: z.object({
      from: z.string().optional().describe("Data inicial no formato YYYY-MM-DD. Padrao: inicio do mes atual."),
      to: z.string().optional().describe("Data final no formato YYYY-MM-DD. Padrao: fim do mes atual."),
      limit: z.number().int().positive().max(20).optional().describe("Quantidade maxima de itens."),
    }),
    execute: async ({ from, to, limit }) => {
      const range = resolveToolRange({ from, to })
      const take = clampToolLimit(limit)
      const items = await getLatestTransactions(userId, range.from, range.to, take)

      return {
        period: {
          from: range.from.toISOString(),
          to: range.to.toISOString(),
        },
        count: items.length,
        total: items.reduce((sum, item) => sum + item.amount, 0),
        formattedTotal: formatMoney(items.reduce((sum, item) => sum + item.amount, 0)),
        items: items.map((item) => ({
          ...item,
          formattedAmount: formatMoney(item.amount),
        })),
      }
    },
  })
}

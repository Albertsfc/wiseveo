import { tool } from "ai"
import { z } from "zod"
import { getUpcomingTransactions } from "@/features/dashboard/services/get-upcoming-transactions"
import { clampToolLimit, formatMoney, resolveUpcomingRange } from "./tool-utils"

export function createUpcomingTransactionsTool(userId: string) {
  return tool({
    description:
      "Lista proximos vencimentos financeiros do usuario. Use para perguntas sobre contas a pagar, contas a receber, vencimentos futuros e lancamentos pendentes.",
    inputSchema: z.object({
      from: z.string().optional().describe("Data inicial no formato YYYY-MM-DD. Padrao: hoje."),
      to: z.string().optional().describe("Data final no formato YYYY-MM-DD."),
      days: z.number().int().positive().max(180).optional().describe("Janela futura em dias."),
      limit: z.number().int().positive().max(20).optional().describe("Quantidade maxima de itens."),
    }),
    execute: async ({ from, to, days, limit }) => {
      const range = resolveUpcomingRange({ from, to, days })
      const take = clampToolLimit(limit)
      const items = await getUpcomingTransactions(userId, range.from, range.to, take)

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

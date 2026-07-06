import { tool } from "ai"
import { z } from "zod"
import { getBudgetData } from "@/features/budget/services/get-budget-data"
import { clampToolLimit, formatMoney, parseToolDate } from "./tool-utils"

export function createBudgetTool(userId: string) {
  return tool({
    description:
      "Retorna o orcamento do mes, execucao por grupo/categoria e percentual consumido. Use para perguntas sobre limite, gasto planejado e estouro de orcamento.",
    inputSchema: z.object({
      referenceDate: z.string().optional().describe("Data de referencia no formato YYYY-MM-DD. Padrao: mes atual."),
      limit: z.number().int().positive().max(20).optional().describe("Quantidade maxima de itens."),
      overBudgetOnly: z.boolean().optional().describe("Quando true, retorna apenas itens acima do limite."),
    }),
    execute: async ({ referenceDate, limit, overBudgetOnly }) => {
      const date = referenceDate ? parseToolDate(referenceDate, new Date(), "start") : new Date()
      const data = await getBudgetData(userId, date)
      const take = clampToolLimit(limit, 10)
      const filteredItems = data.items
        .filter((item) => !overBudgetOnly || (item.limit > 0 && item.spent > item.limit))
        .sort((a, b) => {
          const aPct = a.limit > 0 ? a.spent / a.limit : 0
          const bPct = b.limit > 0 ? b.spent / b.limit : 0
          return bPct - aPct
        })
        .slice(0, take)

      return {
        referenceDate: date.toISOString(),
        totals: {
          limit: data.totalLimit,
          spent: data.totalSpent,
          paid: data.totalPaid,
          scheduled: data.totalScheduled,
          overallPct: data.overallPct,
          formattedLimit: formatMoney(data.totalLimit),
          formattedSpent: formatMoney(data.totalSpent),
          formattedPaid: formatMoney(data.totalPaid),
          formattedScheduled: formatMoney(data.totalScheduled),
          formattedOverallPct: `${data.overallPct.toFixed(2)}%`,
        },
        count: filteredItems.length,
        items: filteredItems.map((item) => {
          const pct = item.limit > 0 ? (item.spent / item.limit) * 100 : 0

          return {
            id: item.id,
            name: item.name,
            originalName: item.originalName,
            isGroup: item.isGroup,
            limit: item.limit,
            spent: item.spent,
            paidAmount: item.paidAmount,
            scheduledAmount: item.scheduledAmount,
            percentUsed: pct,
            remaining: item.limit - item.spent,
            formattedLimit: formatMoney(item.limit),
            formattedSpent: formatMoney(item.spent),
            formattedPaidAmount: formatMoney(item.paidAmount),
            formattedScheduledAmount: formatMoney(item.scheduledAmount),
            formattedPercentUsed: `${pct.toFixed(2)}%`,
            formattedRemaining: formatMoney(item.limit - item.spent),
          }
        }),
      }
    },
  })
}

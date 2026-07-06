import { tool } from "ai"
import { z } from "zod"
import { getDreData } from "@/features/analysis/services/get-dre-data"
import { formatMoney, resolveToolRange } from "./tool-utils"

function formatLineItem(item: { groupCode: string; groupName: string; amount: number; percentage: number; transactionCount: number }) {
  return {
    ...item,
    formattedAmount: formatMoney(item.amount),
    formattedPercentage: `${item.percentage.toFixed(2)}%`,
  }
}

export function createDreTool(userId: string) {
  return tool({
    description:
      "Retorna a DRE do periodo com receitas, despesas, transferencias, resultado operacional e principais grupos.",
    inputSchema: z.object({
      from: z.string().optional().describe("Data inicial no formato YYYY-MM-DD. Padrao: inicio do mes atual."),
      to: z.string().optional().describe("Data final no formato YYYY-MM-DD. Padrao: fim do mes atual."),
      limit: z.number().int().positive().max(20).optional().describe("Quantidade maxima de grupos por secao."),
    }),
    execute: async ({ from, to, limit }) => {
      const range = resolveToolRange({ from, to })
      const data = await getDreData(userId, range.from, range.to)
      const take = Math.max(1, Math.min(limit ?? 5, 20))

      return {
        period: {
          from: range.from.toISOString(),
          to: range.to.toISOString(),
          days: data.periodDays,
        },
        summary: {
          ...data.summary,
          formattedIncome: formatMoney(data.summary.income),
          formattedExpense: formatMoney(data.summary.expense),
          formattedTransferIn: formatMoney(data.summary.transferIn),
          formattedTransferOut: formatMoney(data.summary.transferOut),
          formattedOperationalNet: formatMoney(data.summary.operationalNet),
          formattedNet: formatMoney(data.summary.net),
          formattedAverageDailyNet: formatMoney(data.summary.averageDailyNet),
          formattedMarginPercentage:
            data.summary.marginPercentage == null ? null : `${data.summary.marginPercentage.toFixed(2)}%`,
        },
        topIncomeGroups: data.incomeGroups.slice(0, take).map(formatLineItem),
        topExpenseGroups: data.expenseGroups.slice(0, take).map(formatLineItem),
        topTransferInGroups: data.transferInGroups.slice(0, take).map(formatLineItem),
        topTransferOutGroups: data.transferOutGroups.slice(0, take).map(formatLineItem),
      }
    },
  })
}

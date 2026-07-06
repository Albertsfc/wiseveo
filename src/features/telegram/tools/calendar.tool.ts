import { tool } from "ai"
import { z } from "zod"
import { getCalendarStatement } from "@/features/calendar/services/get-calendar-statement"
import { endOfUTCDay, startOfUTCDay } from "@/lib/financial"
import { clampToolLimit, formatMoney, parseToolDate, pickTransactionTitle } from "./tool-utils"

export function createCalendarDayTool(userId: string) {
  return tool({
    description:
      "Retorna o extrato financeiro de um dia especifico, incluindo saldo inicial, saldo final, entradas, saidas e lancamentos do dia.",
    inputSchema: z.object({
      date: z.string().describe("Data no formato YYYY-MM-DD."),
      limit: z.number().int().positive().max(20).optional().describe("Quantidade maxima de lancamentos."),
    }),
    execute: async ({ date, limit }) => {
      const parsedDate = parseToolDate(date, new Date(), "start")
      const from = startOfUTCDay(parsedDate)
      const to = endOfUTCDay(parsedDate)
      const take = clampToolLimit(limit, 10)
      const statement = await getCalendarStatement(userId, from, to)
      const day = statement.days[0]

      if (!day) {
        return {
          date: from.toISOString(),
          openingBalance: 0,
          closingBalance: 0,
          income: 0,
          expense: 0,
          net: 0,
          items: [],
        }
      }

      return {
        date: day.date,
        openingBalance: day.openingBalance,
        closingBalance: day.closingBalance,
        income: day.income,
        expense: day.expense,
        net: day.net,
        formattedOpeningBalance: formatMoney(day.openingBalance),
        formattedClosingBalance: formatMoney(day.closingBalance),
        formattedIncome: formatMoney(day.income),
        formattedExpense: formatMoney(day.expense),
        formattedNet: formatMoney(day.net),
        count: day.transactions.length,
        items: day.transactions.slice(0, take).map((transaction) => ({
          id: transaction.id,
          title: pickTransactionTitle({
            description: transaction.description,
            note: transaction.note,
            payeeName: transaction.payee?.name,
            categoryName: transaction.category.name,
          }),
          description: transaction.description,
          note: transaction.note,
          type: transaction.type,
          status: transaction.status,
          amount: transaction.amount,
          formattedAmount: formatMoney(transaction.amount),
          categoryName: transaction.category.name,
          accountName: transaction.account.name,
          payeeName: transaction.payee?.name ?? null,
        })),
      }
    },
  })
}

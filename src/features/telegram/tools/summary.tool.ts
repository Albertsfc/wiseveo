import { tool } from "ai";
import { z } from "zod";
import { getFinancialSummary } from "@/features/shared/services/get-financial-summary";
import { formatMoney, resolveToolRange } from "./tool-utils";

export const createSummaryTool = (userId: string) => tool({
  description: "Obtem um resumo financeiro (entradas, saidas, saldo/economia) para um periodo especifico. Use para perguntas como 'como foi meu mes', 'resumo de gastos', 'qual meu saldo'.",
  inputSchema: z.object({
    from: z.string().optional().describe("Data de inicio no formato YYYY-MM-DD. Padrao: inicio do mes atual."),
    to: z.string().optional().describe("Data de fim no formato YYYY-MM-DD. Padrao: fim do mes atual."),
  }),
  execute: async ({ from, to }) => {
    const range = resolveToolRange({ from, to });
    const summary = await getFinancialSummary(userId, range.from, range.to);

    return {
      period: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      },
      ...summary,
      formattedIncome: formatMoney(summary.income),
      formattedExpense: formatMoney(summary.expense),
      formattedSavings: formatMoney(summary.savings),
    };
  },
});

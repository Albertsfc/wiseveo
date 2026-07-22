import { prisma } from "@/lib/prisma"
import type { FixedCommitmentKpi, RecurringLoadKpi } from "../types"

/**
 * Comprometimento fixo (% da renda em recorrentes) e carga de recorrências
 * (R$/mês, R$/ano) — mesma fonte: transações recorrentes EXPENSE cadastradas.
 */
export async function computeRecurringKpis(
  userId: string,
  avgMonthlyIncome: number,
): Promise<{
  fixedCommitment: FixedCommitmentKpi
  recurringLoad: RecurringLoadKpi
}> {
  const templates = await prisma.recurringTransaction.findMany({
    where: { userId, type: "EXPENSE" },
    select: { amount: true },
  })

  const monthlyTotal = templates.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0,
  )
  const count = templates.length

  if (count === 0) {
    return {
      fixedCommitment: {
        state: "empty",
        zone: "neutral",
        avgMonthlyIncome,
        fixedMonthly: 0,
        ratioPct: null,
      },
      recurringLoad: {
        state: "empty",
        zone: "neutral",
        annualTotal: 0,
        count: 0,
        incomeSharePct: null,
        monthlyTotal: 0,
      },
    }
  }

  const ratio = avgMonthlyIncome > 0 ? monthlyTotal / avgMonthlyIncome : null
  const ratioPct = ratio === null ? null : ratio * 100

  const fixedZone =
    ratio === null
      ? "neutral"
      : ratio < 0.5
        ? "good"
        : ratio <= 0.7
          ? "warning"
          : "critical"

  return {
    fixedCommitment: {
      state: ratio === null ? "insufficient" : "ok",
      zone: fixedZone,
      avgMonthlyIncome,
      fixedMonthly: monthlyTotal,
      ratioPct,
    },
    recurringLoad: {
      state: "ok",
      zone: "neutral",
      annualTotal: monthlyTotal * 12,
      count,
      incomeSharePct: ratioPct,
      monthlyTotal,
    },
  }
}

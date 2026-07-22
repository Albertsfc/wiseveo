import { mean, trimLeadingEmpty } from "./monthly-series"
import type { MonthlyFlow, PersonalRunwayKpi } from "../types"

const MIN_MONTHS = 3
const WINDOW = 6

/**
 * Fôlego do caixa: saldo de hoje ÷ queima líquida média (saídas − receitas)
 * dos últimos 6 meses fechados. Complementa a reserva de emergência: a
 * reserva simula renda zero; aqui é a trajetória real. Quando a média é de
 * poupança, não há queima — o card reporta o crescimento médio mensal.
 */
export function computePersonalRunway(
  balanceToday: number,
  closedFlows: MonthlyFlow[],
): PersonalRunwayKpi {
  const flows = trimLeadingEmpty(closedFlows)

  if (flows.length < MIN_MONTHS) {
    return {
      state: "insufficient",
      zone: "neutral",
      balanceToday,
      netMonthly: 0,
      runwayMonths: null,
    }
  }

  const netMonthly = mean(
    flows.slice(-WINDOW).map((f) => f.income - f.outflow),
  )

  if (netMonthly >= 0) {
    return {
      state: "ok",
      zone: "good",
      balanceToday,
      netMonthly,
      runwayMonths: null,
    }
  }

  const runwayMonths = Math.max(0, balanceToday) / Math.abs(netMonthly)

  return {
    state: "ok",
    zone: runwayMonths >= 12 ? "good" : runwayMonths >= 6 ? "warning" : "critical",
    balanceToday,
    netMonthly,
    runwayMonths,
  }
}

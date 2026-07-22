import { mean, stdDev, trimLeadingEmpty } from "./monthly-series"
import type { EmergencyRunwayKpi, MonthlyFlow } from "../types"

const MIN_MONTHS = 3
const EXPENSE_WINDOW = 6
const CV_WINDOW = 12
const DEFAULT_TARGET_MONTHS = 6

/**
 * Alvo de reserva calibrado pela volatilidade da renda do próprio usuário
 * (coeficiente de variação σ/μ das receitas mensais): renda estável pede menos
 * meses, renda irregular pede mais.
 */
function targetForCv(cv: number): number {
  if (cv < 0.15) return 3
  if (cv < 0.3) return 4.5
  if (cv < 0.5) return 6
  return 9
}

/**
 * Cobertura da reserva em meses de despesa. Recebe apenas meses FECHADOS
 * (o corrente, parcial, distorceria a média) e o saldo total de hoje.
 *
 * Aproximação registrada no spec: usa o saldo de todas as contas ativas —
 * não há marcação de "conta de reserva" no modelo atual.
 */
export function computeEmergencyRunway(
  balanceToday: number,
  closedFlows: MonthlyFlow[],
): EmergencyRunwayKpi {
  const flows = trimLeadingEmpty(closedFlows)

  const insufficient: EmergencyRunwayKpi = {
    state: "insufficient",
    zone: "neutral",
    avgMonthlyExpense: 0,
    coverageMonths: 0,
    incomeCvPct: 0,
    targetMonths: DEFAULT_TARGET_MONTHS,
  }

  if (flows.length < MIN_MONTHS) return insufficient

  const avgExpense = mean(
    flows.slice(-EXPENSE_WINDOW).map((f) => f.outflow),
  )
  if (avgExpense <= 0) return insufficient

  const incomes = flows.slice(-CV_WINDOW).map((f) => f.income)
  const avgIncome = mean(incomes)
  const cv = avgIncome > 0 ? stdDev(incomes) / avgIncome : null

  const targetMonths = cv === null ? DEFAULT_TARGET_MONTHS : targetForCv(cv)
  const coverageMonths = Math.max(0, balanceToday) / avgExpense
  const ratio = coverageMonths / targetMonths

  return {
    state: "ok",
    zone: ratio >= 1 ? "good" : ratio >= 0.4 ? "warning" : "critical",
    avgMonthlyExpense: avgExpense,
    coverageMonths,
    incomeCvPct: (cv ?? 0) * 100,
    targetMonths,
  }
}

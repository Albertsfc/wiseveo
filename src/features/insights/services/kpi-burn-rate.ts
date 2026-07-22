import { mean, trimLeadingEmpty } from "./monthly-series"
import type { BurnRateKpi, MonthlyFlow } from "../types"

const MIN_MONTHS = 4
const RECENT_WINDOW = 3
const BASELINE_WINDOW = 12

/**
 * Burn pessoal: média de saídas dos últimos 3 meses fechados vs. média dos
 * últimos 12. Alta sustentada acima da própria base é o sinal silencioso de
 * erosão do orçamento — invisível olhando um mês isolado.
 */
export function computeBurnRate(closedFlows: MonthlyFlow[]): BurnRateKpi {
  const flows = trimLeadingEmpty(closedFlows)

  if (flows.length < MIN_MONTHS) {
    return {
      state: "insufficient",
      zone: "neutral",
      baselineMonthly: 0,
      deltaPct: 0,
      recentMonthly: 0,
      series: [],
    }
  }

  const last12 = flows.slice(-BASELINE_WINDOW)
  const baselineMonthly = mean(last12.map((f) => f.outflow))
  const recentMonthly = mean(flows.slice(-RECENT_WINDOW).map((f) => f.outflow))

  if (baselineMonthly <= 0) {
    return {
      state: "insufficient",
      zone: "neutral",
      baselineMonthly: 0,
      deltaPct: 0,
      recentMonthly,
      series: last12.map((f) => f.outflow),
    }
  }

  const deltaPct = ((recentMonthly - baselineMonthly) / baselineMonthly) * 100

  return {
    state: "ok",
    zone: deltaPct <= 10 ? "good" : deltaPct <= 25 ? "warning" : "critical",
    baselineMonthly,
    deltaPct,
    recentMonthly,
    series: last12.map((f) => f.outflow),
  }
}

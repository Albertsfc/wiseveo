import type { MonthlyFlow, MonthlyRatePoint, SavingsRateKpi } from "../types"

const MIN_MONTHS_WITH_INCOME = 3

/**
 * Taxa de poupança = (receitas − saídas) / receitas, por competência mensal.
 * Recebe a série completa (13 meses: 12 fechados + o corrente).
 */
export function computeSavingsRate(flows: MonthlyFlow[]): SavingsRateKpi {
  const series: MonthlyRatePoint[] = flows.map((f) => ({
    period: f.period,
    rate: f.income > 0 ? (f.income - f.outflow) / f.income : null,
  }))

  const current = series[series.length - 1] ?? null
  const past = series.slice(0, -1)
  const pastRates = past
    .map((p) => p.rate)
    .filter((r): r is number => r !== null)

  if (pastRates.length < MIN_MONTHS_WITH_INCOME) {
    return {
      state: "insufficient",
      zone: "neutral",
      avg12mRatePct: null,
      currentMonthRatePct: null,
      series,
    }
  }

  const avg12m =
    pastRates.reduce((sum, r) => sum + r, 0) / pastRates.length

  // Zona pela média dos últimos 3 meses com receita (mais sensível que a média
  // de 12m, menos ruidosa que o mês corrente parcial).
  const recentRates = past
    .slice(-3)
    .map((p) => p.rate)
    .filter((r): r is number => r !== null)
  const zoneBasis =
    recentRates.length > 0
      ? recentRates.reduce((sum, r) => sum + r, 0) / recentRates.length
      : avg12m

  const zone = zoneBasis < 0 ? "critical" : zoneBasis < 0.1 ? "warning" : "good"

  return {
    state: "ok",
    zone,
    avg12mRatePct: avg12m * 100,
    currentMonthRatePct: current?.rate !== null && current ? current.rate * 100 : null,
    series,
  }
}

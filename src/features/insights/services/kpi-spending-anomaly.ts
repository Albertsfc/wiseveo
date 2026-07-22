import { prisma } from "@/lib/prisma"
import { lastPeriods, median, medianAbsDeviation } from "./monthly-series"
import type { SpendingAnomalyItem, SpendingAnomalyKpi } from "../types"

const HISTORY_MONTHS = 12
const MIN_MONTHS = 6
const Z_THRESHOLD = 3.5
const Z_FACTOR = 0.6745 // constante do z-score modificado (Iglewicz & Hoaglin)
const ABS_FLOOR = 50 // desvio mínimo em moeda para não alertar ruído

function periodKeyUtc(date: Date): string {
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

/**
 * Atipicidade do mês por grupo de despesa: compara o total do mês corrente
 * com a mediana dos últimos 12 meses fechados via z-score modificado com MAD
 * (limiar 3,5) — robusto a picos antigos, que contaminariam média e desvio.
 * Só sinaliza gasto ACIMA do padrão; o mês parcial vieza para baixo (menos
 * falsos positivos, nunca mais).
 */
export async function computeSpendingAnomaly(
  userId: string,
  now = new Date(),
): Promise<SpendingAnomalyKpi> {
  const periods = lastPeriods(HISTORY_MONTHS + 1, now)
  const currentPeriod = periods[periods.length - 1]
  const closedPeriods = periods.slice(0, -1)

  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - HISTORY_MONTHS, 1),
  )
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
  )

  const [transactions, groups] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, type: "EXPENSE", date: { gte: start, lte: end } },
      select: { amount: true, date: true, groupCode: true },
    }),
    prisma.categoryGroup.findMany({
      where: { userId, type: "EXPENSE" },
      select: { code: true, name: true },
    }),
  ])

  const nameByCode = new Map(groups.map((g) => [g.code, g.name]))

  // totais[groupCode][period]
  const totals = new Map<number, Map<string, number>>()
  for (const tx of transactions) {
    const period = periodKeyUtc(tx.date)
    let byPeriod = totals.get(tx.groupCode)
    if (!byPeriod) {
      byPeriod = new Map()
      totals.set(tx.groupCode, byPeriod)
    }
    byPeriod.set(period, (byPeriod.get(period) ?? 0) + Math.abs(tx.amount))
  }

  // Histórico útil: só a partir do primeiro mês fechado com algum gasto.
  const activityByPeriod = closedPeriods.map((p) =>
    [...totals.values()].some((byPeriod) => (byPeriod.get(p) ?? 0) > 0),
  )
  const firstActive = activityByPeriod.indexOf(true)
  const usablePeriods = firstActive === -1 ? [] : closedPeriods.slice(firstActive)

  if (usablePeriods.length < MIN_MONTHS) {
    return {
      state: "insufficient",
      zone: "neutral",
      anomalies: [],
      count: 0,
    }
  }

  const flagged: (SpendingAnomalyItem & { deviation: number })[] = []

  for (const [groupCode, byPeriod] of totals) {
    const history = usablePeriods.map((p) => byPeriod.get(p) ?? 0)
    const current = byPeriod.get(currentPeriod) ?? 0
    if (current <= 0) continue

    const med = median(history)
    const mad = medianAbsDeviation(history)
    const deviation = current - med

    const isAnomalous =
      mad > 0
        ? (Z_FACTOR * deviation) / mad > Z_THRESHOLD && deviation >= ABS_FLOOR
        : deviation >= Math.max(2 * ABS_FLOOR, med)

    if (isAnomalous) {
      flagged.push({
        amount: current,
        deviation,
        medianAmount: med,
        name: nameByCode.get(groupCode) ?? String(groupCode),
      })
    }
  }

  flagged.sort((a, b) => b.deviation - a.deviation)
  const count = flagged.length

  return {
    state: "ok",
    zone: count === 0 ? "good" : count <= 2 ? "warning" : "critical",
    anomalies: flagged
      .slice(0, 3)
      .map(({ amount, medianAmount, name }) => ({ amount, medianAmount, name })),
    count,
  }
}

import { prisma } from "@/lib/prisma"
import { endOfUTCDay, startOfUTCDay } from "@/lib/financial"
import { paidStatusFilter } from "./paid-status"
import { quantile, trimLeadingEmpty } from "./monthly-series"
import type { MonthEndForecastKpi, MonthlyFlow } from "../types"

const MIN_CLOSED_MONTHS = 3
const DIFFUSE_WINDOW_DAYS = 90
const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Fim de mês projetado: saídas já lançadas no mês (pagas e agendadas, visão
 * de competência) + estimativa de gasto difuso para os dias restantes (média
 * diária das despesas pagas dos últimos 90 dias, excluindo o decil superior).
 * A banda p25–p75 vem da distribuição dos últimos 12 meses fechados e a zona
 * compara a projeção com a renda média mensal.
 */
export async function computeMonthEndForecast(
  userId: string,
  flows: MonthlyFlow[],
  avgMonthlyIncome: number,
  now = new Date(),
): Promise<MonthEndForecastKpi> {
  const trimmed = trimLeadingEmpty(flows)
  const closed = trimmed.slice(0, -1)

  if (closed.length < MIN_CLOSED_MONTHS) {
    return {
      state: "insufficient",
      zone: "neutral",
      avgMonthlyIncome,
      bookedMonth: 0,
      diffuseRemainder: 0,
      p25: 0,
      p75: 0,
      projectedOutflow: 0,
    }
  }

  const bookedMonth = flows[flows.length - 1]?.outflow ?? 0

  const recentPaid = await prisma.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      date: {
        gte: startOfUTCDay(new Date(now.getTime() - DIFFUSE_WINDOW_DAYS * DAY_MS)),
        lte: endOfUTCDay(now),
      },
      ...paidStatusFilter(),
    },
    select: { amount: true },
  })

  const values = recentPaid.map((tx) => Math.abs(tx.amount)).sort((a, b) => a - b)
  const keep = values.slice(
    0,
    Math.max(1, values.length - Math.ceil(values.length * 0.1)),
  )
  const diffuseDaily =
    keep.reduce((sum, v) => sum + v, 0) / DIFFUSE_WINDOW_DAYS

  const daysInMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
  ).getUTCDate()
  const daysLeft = daysInMonth - now.getUTCDate()
  const diffuseRemainder = diffuseDaily * daysLeft
  const projectedOutflow = bookedMonth + diffuseRemainder

  const closedOutflows = closed.slice(-12).map((f) => f.outflow)
  const p25 = quantile(closedOutflows, 0.25)
  const p75 = quantile(closedOutflows, 0.75)

  let zone: MonthEndForecastKpi["zone"] = "neutral"
  if (avgMonthlyIncome > 0) {
    const ratio = projectedOutflow / avgMonthlyIncome
    zone = ratio < 0.9 ? "good" : ratio <= 1.05 ? "warning" : "critical"
  }

  return {
    state: "ok",
    zone,
    avgMonthlyIncome,
    bookedMonth,
    diffuseRemainder,
    p25,
    p75,
    projectedOutflow,
  }
}

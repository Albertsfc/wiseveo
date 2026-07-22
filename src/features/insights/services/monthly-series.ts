import { prisma } from "@/lib/prisma"
import type { MonthlyFlow } from "../types"

function periodKeyUtc(date: Date): string {
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

/** Períodos YYYYMM do mais antigo ao mais recente, terminando no mês de `now`. */
export function lastPeriods(months: number, now: Date): string[] {
  const periods: string[] = []
  for (let i = months - 1; i >= 0; i--) {
    periods.push(
      periodKeyUtc(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))),
    )
  }
  return periods
}

/**
 * Série mensal de receitas e saídas dos últimos `months` meses (inclui o mês
 * corrente por inteiro, agendadas inclusive — mesma visão de competência do
 * dashboard). Meses sem lançamentos entram zerados: para volatilidade, um mês
 * sem receita é dado real, não ausência de dado.
 */
export async function getMonthlyFlows(
  userId: string,
  months: number,
  now = new Date(),
): Promise<MonthlyFlow[]> {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1),
  )
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
  )

  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: start, lte: end } },
    select: { amount: true, date: true, type: true },
  })

  const byPeriod = new Map<string, MonthlyFlow>()
  for (const period of lastPeriods(months, now)) {
    byPeriod.set(period, { period, income: 0, outflow: 0 })
  }

  for (const tx of transactions) {
    const bucket = byPeriod.get(periodKeyUtc(tx.date))
    if (!bucket) continue

    if (tx.type === "INCOME") {
      bucket.income += tx.amount
    } else if (tx.type === "EXPENSE") {
      bucket.outflow += Math.abs(tx.amount)
    } else if (tx.type === "TRANSFER" && tx.amount < 0) {
      bucket.outflow += Math.abs(tx.amount)
    }
  }

  return [...byPeriod.values()]
}

/** Remove meses vazios do início da série (antes do primeiro lançamento do usuário). */
export function trimLeadingEmpty(flows: MonthlyFlow[]): MonthlyFlow[] {
  const firstWithData = flows.findIndex((f) => f.income !== 0 || f.outflow !== 0)
  return firstWithData === -1 ? [] : flows.slice(firstWithData)
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/** Desvio-padrão populacional. */
export function stdDev(values: number[]): number {
  if (values.length === 0) return 0
  const m = mean(values)
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)))
}

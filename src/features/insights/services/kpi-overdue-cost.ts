import { prisma } from "@/lib/prisma"
import { startOfUTCDay } from "@/lib/financial"
import { unpaidStatusFilter } from "./paid-status"
import type { OverdueCostKpi } from "../types"

const DAY_MS = 24 * 60 * 60 * 1000

// Padrão brasileiro (CDC): multa de 2% (única) + juros de mora de ~1% ao mês,
// pro rata por dia de atraso. Estimativa — boletos específicos podem divergir.
const LATE_FINE_RATE = 0.02
const MONTHLY_INTEREST_RATE = 0.01

/**
 * Contas vencidas em aberto: quantidade, total e custo estimado do atraso.
 *
 * Limitação registrada no spec: não há data de pagamento separada da data da
 * transação, então contas pagas com atraso no passado não são mensuráveis —
 * o KPI cobre apenas o que está vencido AGORA.
 */
export async function computeOverdueCost(
  userId: string,
  now = new Date(),
): Promise<OverdueCostKpi> {
  const today = startOfUTCDay(now)

  const overdue = await prisma.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      date: { lt: today },
      ...unpaidStatusFilter(),
    },
    select: { amount: true, date: true },
  })

  let totalAmount = 0
  let estimatedCost = 0
  let oldestDays = 0

  for (const tx of overdue) {
    const value = Math.abs(tx.amount)
    const daysLate = Math.max(
      1,
      Math.floor((today.getTime() - tx.date.getTime()) / DAY_MS),
    )
    totalAmount += value
    estimatedCost +=
      value * (LATE_FINE_RATE + MONTHLY_INTEREST_RATE * (daysLate / 30))
    oldestDays = Math.max(oldestDays, daysLate)
  }

  const count = overdue.length
  const zone =
    count === 0
      ? "good"
      : count <= 2 && estimatedCost <= 50
        ? "warning"
        : "critical"

  return { state: "ok", zone, count, estimatedCost, oldestDays, totalAmount }
}

import { prisma } from "@/lib/prisma"
import { endOfUTCDay } from "@/lib/financial"
import { unpaidStatusFilter } from "./paid-status"
import type { SafeToSpendKpi } from "../types"

const HORIZON_DAYS = 30

function daysLeftInMonthUtc(now: Date): number {
  const daysInMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
  ).getUTCDate()
  return daysInMonth - now.getUTCDate() + 1
}

/**
 * Livre para gastar = saldo de hoje − despesas em aberto (pendentes,
 * agendadas e vencidas) com vencimento até hoje + 30 dias. Receitas futuras
 * não entram — visão conservadora.
 */
export async function computeSafeToSpend(
  userId: string,
  balanceToday: number,
  avgMonthlyExpense: number,
  now = new Date(),
): Promise<SafeToSpendKpi> {
  const horizon = endOfUTCDay(
    new Date(now.getTime() + HORIZON_DAYS * 24 * 60 * 60 * 1000),
  )

  const committedAgg = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: {
      userId,
      type: "EXPENSE",
      date: { lte: horizon },
      ...unpaidStatusFilter(),
    },
  })

  const committed30d = Math.abs(committedAgg._sum.amount ?? 0)
  const available = balanceToday - committed30d
  const daysLeftInMonth = daysLeftInMonthUtc(now)
  const perDay = available > 0 ? available / daysLeftInMonth : 0

  const warningFloor = avgMonthlyExpense > 0 ? avgMonthlyExpense * 0.1 : 0
  const zone =
    available <= 0 ? "critical" : available < warningFloor ? "warning" : "good"

  return {
    state: "ok",
    zone,
    available,
    balanceToday,
    committed30d,
    daysLeftInMonth,
    perDay,
  }
}

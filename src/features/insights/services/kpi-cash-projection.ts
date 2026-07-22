import { prisma } from "@/lib/prisma"
import { endOfUTCDay, startOfUTCDay } from "@/lib/financial"
import type { AccountWithBalance } from "@/features/accounts/types"
import { paidStatusFilter, unpaidStatusFilter } from "./paid-status"
import type { CashProjectionKpi } from "../types"

const HORIZON_DAYS = 30
const DIFFUSE_WINDOW_DAYS = 90
const DAY_MS = 24 * 60 * 60 * 1000

interface DatedAmount {
  accountId: number
  amount: number
  date: Date
}

/**
 * Gasto difuso diário por conta: média das despesas pagas dos últimos 90 dias,
 * excluindo o decil superior (picos não representam o dia a dia — método
 * HistAvg da literatura de previsão de saldo).
 */
function diffuseDailyByAccount(paid: DatedAmount[]): Map<number, number> {
  const byAccount = new Map<number, number[]>()
  for (const tx of paid) {
    const list = byAccount.get(tx.accountId) ?? []
    list.push(Math.abs(tx.amount))
    byAccount.set(tx.accountId, list)
  }

  const rates = new Map<number, number>()
  for (const [accountId, values] of byAccount) {
    values.sort((a, b) => a - b)
    const keep = values.slice(0, Math.max(1, values.length - Math.ceil(values.length * 0.1)))
    const total = keep.reduce((sum, v) => sum + v, 0)
    rates.set(accountId, total / DIFFUSE_WINDOW_DAYS)
  }
  return rates
}

/**
 * Projeção diária de saldo por conta líquida (corrente e carteira) nos
 * próximos 30 dias: saldo de hoje + lançamentos em aberto por data − gasto
 * difuso diário. Despesas vencidas em aberto entram no dia 1; receitas
 * atrasadas não entram (conservador). Reporta o primeiro cruzamento abaixo
 * de zero entre todas as contas.
 */
export async function computeCashProjection(
  userId: string,
  accounts: AccountWithBalance[],
  now = new Date(),
): Promise<CashProjectionKpi> {
  const liquidAccounts = accounts.filter(
    (a) => a.type === "CHECKING" || a.type === "WALLET",
  )
  const projectable = liquidAccounts.length > 0 ? liquidAccounts : accounts

  if (projectable.length === 0) {
    return {
      state: "insufficient",
      zone: "neutral",
      accountName: null,
      daysToNegative: null,
      horizonDays: HORIZON_DAYS,
      projectedDate: null,
    }
  }

  const accountIds = projectable.map((a) => a.id)
  const todayEnd = endOfUTCDay(now)
  const horizonEnd = endOfUTCDay(new Date(now.getTime() + HORIZON_DAYS * DAY_MS))
  const diffuseStart = startOfUTCDay(
    new Date(now.getTime() - DIFFUSE_WINDOW_DAYS * DAY_MS),
  )

  const [scheduled, overdueExpenses, recentPaid] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        accountId: { in: accountIds },
        type: { in: ["INCOME", "EXPENSE"] },
        date: { gt: todayEnd, lte: horizonEnd },
        ...unpaidStatusFilter(),
      },
      select: { accountId: true, amount: true, date: true },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        accountId: { in: accountIds },
        type: "EXPENSE",
        date: { lte: todayEnd },
        ...unpaidStatusFilter(),
      },
      select: { accountId: true, amount: true, date: true },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        accountId: { in: accountIds },
        type: "EXPENSE",
        date: { gte: diffuseStart, lte: todayEnd },
        ...paidStatusFilter(),
      },
      select: { accountId: true, amount: true, date: true },
    }),
  ])

  const diffuseRates = diffuseDailyByAccount(recentPaid)

  // Lançamentos futuros agrupados por (conta, dia relativo 1..30).
  const scheduledByAccountDay = new Map<string, number>()
  for (const tx of scheduled) {
    const day = Math.min(
      HORIZON_DAYS,
      Math.max(1, Math.ceil((tx.date.getTime() - todayEnd.getTime()) / DAY_MS)),
    )
    const key = `${tx.accountId}:${day}`
    scheduledByAccountDay.set(key, (scheduledByAccountDay.get(key) ?? 0) + tx.amount)
  }

  const overdueByAccount = new Map<number, number>()
  for (const tx of overdueExpenses) {
    overdueByAccount.set(
      tx.accountId,
      (overdueByAccount.get(tx.accountId) ?? 0) + tx.amount,
    )
  }

  let earliestDay: number | null = null
  let earliestAccountName: string | null = null

  for (const account of projectable) {
    let balance = account.currentBalance
    const diffuse = diffuseRates.get(account.id) ?? 0

    for (let day = 1; day <= HORIZON_DAYS; day++) {
      if (day === 1) balance += overdueByAccount.get(account.id) ?? 0
      balance += scheduledByAccountDay.get(`${account.id}:${day}`) ?? 0
      balance -= diffuse

      if (balance < 0) {
        if (earliestDay === null || day < earliestDay) {
          earliestDay = day
          earliestAccountName = account.name
        }
        break
      }
    }
  }

  if (earliestDay === null) {
    return {
      state: "ok",
      zone: "good",
      accountName: null,
      daysToNegative: null,
      horizonDays: HORIZON_DAYS,
      projectedDate: null,
    }
  }

  return {
    state: "ok",
    zone: earliestDay >= 15 ? "warning" : "critical",
    accountName: earliestAccountName,
    daysToNegative: earliestDay,
    horizonDays: HORIZON_DAYS,
    projectedDate: new Date(now.getTime() + earliestDay * DAY_MS).toISOString(),
  }
}

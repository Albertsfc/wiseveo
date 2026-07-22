import { endOfUTCDay } from "@/lib/financial"
import { getAccountsWithBalance } from "@/features/accounts/services/get-accounts"
import { computeBudgetPacing } from "./kpi-budget-pacing"
import { computeCashProjection } from "./kpi-cash-projection"
import { computeEmergencyRunway } from "./kpi-emergency-runway"
import { computeOverdueCost } from "./kpi-overdue-cost"
import { computeRecurringKpis } from "./kpi-fixed-commitment"
import { computeSafeToSpend } from "./kpi-safe-to-spend"
import { computeSavingsRate } from "./kpi-savings-rate"
import { getMonthlyFlows, mean, trimLeadingEmpty } from "./monthly-series"
import type { InsightsData } from "../types"

const FLOW_MONTHS = 13 // 12 meses fechados + o corrente

/** Calcula todos os KPIs da página de insights numa única passada. */
export async function getInsightsData(
  userId: string,
  now = new Date(),
): Promise<InsightsData> {
  const [flows, accounts] = await Promise.all([
    getMonthlyFlows(userId, FLOW_MONTHS, now),
    getAccountsWithBalance(userId, endOfUTCDay(now)),
  ])

  const balanceToday = accounts.reduce(
    (sum, account) => sum + account.currentBalance,
    0,
  )

  const closedFlows = flows.slice(0, -1)
  const avgMonthlyIncome = mean(
    trimLeadingEmpty(closedFlows)
      .slice(-12)
      .map((f) => f.income),
  )

  const emergencyRunway = computeEmergencyRunway(balanceToday, closedFlows)
  const savingsRate = computeSavingsRate(trimLeadingEmpty(flows))

  const [safeToSpend, recurringKpis, overdueCost, budgetPacing, cashProjection] =
    await Promise.all([
      computeSafeToSpend(
        userId,
        balanceToday,
        emergencyRunway.avgMonthlyExpense,
        now,
      ),
      computeRecurringKpis(userId, avgMonthlyIncome),
      computeOverdueCost(userId, now),
      computeBudgetPacing(userId, now),
      computeCashProjection(userId, accounts, now),
    ])

  return {
    budgetPacing,
    cashProjection,
    emergencyRunway,
    fixedCommitment: recurringKpis.fixedCommitment,
    overdueCost,
    recurringLoad: recurringKpis.recurringLoad,
    safeToSpend,
    savingsRate,
  }
}

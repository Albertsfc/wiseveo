export type KpiZone = "good" | "warning" | "critical" | "neutral"

/**
 * - "ok"           → valor calculado normalmente
 * - "insufficient" → histórico abaixo do mínimo do KPI; não exibir número enganoso
 * - "empty"        → pré-requisito de cadastro ausente (ex.: sem orçamento, sem recorrentes)
 */
export type KpiState = "ok" | "insufficient" | "empty"

export type KpiSection = "today" | "patterns" | "projections"

export interface KpiBase {
  state: KpiState
  zone: KpiZone
}

/** Fluxo mensal por competência (mesma semântica do dashboard: saída = despesas + transferências negativas). */
export interface MonthlyFlow {
  period: string // YYYYMM
  income: number
  outflow: number
}

export interface SafeToSpendKpi extends KpiBase {
  available: number
  balanceToday: number
  committed30d: number
  daysLeftInMonth: number
  perDay: number
}

export interface EmergencyRunwayKpi extends KpiBase {
  avgMonthlyExpense: number
  coverageMonths: number
  incomeCvPct: number
  targetMonths: number
}

export interface BudgetPacingKpi extends KpiBase {
  monthPct: number
  pacing: number
  projectedOverrunDay: number | null
  totalLimit: number
  totalSpent: number
  usagePct: number
  worstItemName: string | null
  worstItemPct: number | null
}

export interface MonthlyRatePoint {
  period: string // YYYYMM
  rate: number | null // null quando o mês não teve receita
}

export interface SavingsRateKpi extends KpiBase {
  avg12mRatePct: number | null
  currentMonthRatePct: number | null
  series: MonthlyRatePoint[]
}

export interface FixedCommitmentKpi extends KpiBase {
  avgMonthlyIncome: number
  fixedMonthly: number
  ratioPct: number | null
}

export interface RecurringLoadKpi extends KpiBase {
  annualTotal: number
  count: number
  incomeSharePct: number | null
  monthlyTotal: number
}

export interface OverdueCostKpi extends KpiBase {
  count: number
  estimatedCost: number
  oldestDays: number
  totalAmount: number
}

export interface CashProjectionKpi extends KpiBase {
  accountName: string | null
  daysToNegative: number | null // null = sem evento no horizonte
  horizonDays: number
  projectedDate: string | null // ISO
}

export interface InsightsData {
  budgetPacing: BudgetPacingKpi
  cashProjection: CashProjectionKpi
  emergencyRunway: EmergencyRunwayKpi
  fixedCommitment: FixedCommitmentKpi
  overdueCost: OverdueCostKpi
  recurringLoad: RecurringLoadKpi
  safeToSpend: SafeToSpendKpi
  savingsRate: SavingsRateKpi
}

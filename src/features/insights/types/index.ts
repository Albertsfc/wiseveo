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

export interface BurnRateKpi extends KpiBase {
  baselineMonthly: number
  deltaPct: number
  recentMonthly: number
  series: number[] // saídas dos últimos 12 meses fechados
}

export interface SpendingAnomalyItem {
  amount: number
  medianAmount: number
  name: string
}

export interface SpendingAnomalyKpi extends KpiBase {
  anomalies: SpendingAnomalyItem[] // top 3, do maior desvio para o menor
  count: number
}

export interface MonthEndForecastKpi extends KpiBase {
  avgMonthlyIncome: number
  bookedMonth: number
  diffuseRemainder: number
  p25: number
  p75: number
  projectedOutflow: number
}

export interface PersonalRunwayKpi extends KpiBase {
  balanceToday: number
  netMonthly: number // receitas − saídas (positivo = poupa, negativo = queima)
  runwayMonths: number | null // null quando não há queima
}

export interface InsightsData {
  budgetPacing: BudgetPacingKpi
  burnRate: BurnRateKpi
  cashProjection: CashProjectionKpi
  emergencyRunway: EmergencyRunwayKpi
  fixedCommitment: FixedCommitmentKpi
  monthEndForecast: MonthEndForecastKpi
  overdueCost: OverdueCostKpi
  personalRunway: PersonalRunwayKpi
  recurringLoad: RecurringLoadKpi
  safeToSpend: SafeToSpendKpi
  savingsRate: SavingsRateKpi
  spendingAnomaly: SpendingAnomalyKpi
}

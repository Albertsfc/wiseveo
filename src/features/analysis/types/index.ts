export interface DreLineItem {
  groupCode: string
  groupName: string
  amount: number
  percentage: number
  transactionCount: number
}

export interface DreSummary {
  income: number
  expense: number
  transferIn: number
  transferOut: number
  operationalNet: number
  net: number
  marginPercentage: number | null
  transactionCount: number
  incomeGroupCount: number
  expenseGroupCount: number
  transferInGroupCount: number
  transferOutGroupCount: number
  averageDailyNet: number
}

export interface DreData {
  summary: DreSummary
  incomeGroups: DreLineItem[]
  expenseGroups: DreLineItem[]
  transferInGroups: DreLineItem[]
  transferOutGroups: DreLineItem[]
  topIncomeGroup: DreLineItem | null
  topExpenseGroup: DreLineItem | null
  topTransferInGroup: DreLineItem | null
  topTransferOutGroup: DreLineItem | null
  periodDays: number
}

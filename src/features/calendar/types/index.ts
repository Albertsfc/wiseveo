export interface CalendarTransaction {
  id: string
  description: string | null
  note: string | null
  amount: number
  type: "INCOME" | "EXPENSE" | "TRANSFER"
  status: "PAID" | "PENDING" | "OVERDUE" | "SCHEDULED"
  category: { name: string }
  account: { name: string }
  payee: { name: string } | null
}

export interface CalendarDayStatement {
  date: string // "YYYY-MM-DD"
  openingBalance: number
  closingBalance: number
  income: number
  expense: number
  net: number
  transactions: CalendarTransaction[]
}

export interface CalendarStatementResponse {
  days: CalendarDayStatement[]
  openingBalance: number
}

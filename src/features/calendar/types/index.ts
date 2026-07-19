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

/**
 * Stable, locale-independent phase tokens emitted by
 * services/sync-google-calendar.ts through the onProgress callback and
 * matched via substring on the client (google-sync-button.tsx /
 * google-clear-button.tsx) to pick a translated, compacted label. These are
 * a wire protocol, never rendered directly — they must NOT be translated
 * with the request locale, or the client's phase detection breaks for
 * non-Portuguese locales.
 */
export const CALENDAR_SYNC_PHASE = {
  removingOld: "removing-old-events",
  syncingEvents: "syncing-events",
} as const

export const CALENDAR_CLEAR_PHASE = {
  clearingEvents: "clearing-events",
} as const

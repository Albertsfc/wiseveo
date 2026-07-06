import { getValidAccessToken } from "@/lib/google-auth"
import { prisma } from "@/lib/prisma"
import { safeBalance, startOfUTCDay, endOfUTCDay } from "@/lib/financial"

const STATUS_MAP: Record<string, string> = {
  PAGO: "Pago",
  ABERTO: "Agendado",
  PENDENTE: "Pendente",
  VENCIDO: "Vencido",
  PAID: "Pago",
  SCHEDULED: "Agendado",
  PENDING: "Pendente",
  OVERDUE: "Vencido",
}

// Google Calendar colorId: 10 = green, 11 = red, 9 = blue
const TYPE_COLOR_ID: Record<string, string> = {
  INCOME: "10",
  EXPENSE: "11",
  TRANSFER: "9",
}

const WISEVEO_TAG = "Sincronizado via WISEVEO"

const numFmt = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatAmount(value: number): string {
  if (value < 0) return `(${numFmt.format(Math.abs(value))})`
  return numFmt.format(value)
}

function utcDateKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`
}

export interface SyncResult {
  synced: number
  errors: number
  deleted: number
}

export type ProgressCallback = (current: number, total: number, phase: string) => void

interface GoogleEvent {
  summary: string
  description?: string
  start: { date: string }
  end: { date: string }
  colorId: string
}

function isWiseveoEvent(item: { description?: string; summary?: string }): boolean {
  const desc = item.description ?? ""
  const summary = item.summary ?? ""
  return (
    desc.includes(WISEVEO_TAG) ||
    summary.includes("Saldo Inicial") ||
    summary.includes("Saldo Final")
  )
}

/**
 * Deletes all WISEVEO-tagged events in a date range from Google Calendar.
 * Returns the number of events deleted.
 */
async function deleteWiseveoEvents(
  accessToken: string,
  from: string,
  to: string,
  onProgress?: ProgressCallback,
): Promise<number> {
  const eventIds: string[] = []
  let pageToken: string | undefined

  // 1) List WISEVEO events in range to compute a real total for progress
  do {
    const params = new URLSearchParams({
      timeMin: `${from}T00:00:00Z`,
      timeMax: `${to}T23:59:59Z`,
      maxResults: "250",
      singleEvents: "true",
    })
    if (pageToken) params.set("pageToken", pageToken)

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    )

    if (!res.ok) {
      const errText = await res.text()
      console.error("[Google Calendar sync] List for delete failed:", errText)
      break
    }

    const data = await res.json()
    const items = data.items ?? []

    for (const item of items) {
      if (isWiseveoEvent(item) && item.id) {
        eventIds.push(item.id)
      }
    }

    pageToken = data.nextPageToken
  } while (pageToken)

  let deleted = 0
  const total = eventIds.length
  onProgress?.(0, total, "Removendo eventos antigos")

  // 2) Delete with progress updates
  for (let idx = 0; idx < eventIds.length; idx++) {
    const eventId = eventIds[idx]
    const delRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    )
    if (delRes.ok || delRes.status === 204) {
      deleted++
    }

    onProgress?.(idx + 1, total, "Removendo eventos antigos")

    if ((idx + 1) % 10 === 0) {
      await new Promise((r) => setTimeout(r, 200))
    }
  }

  return deleted
}

/**
 * Syncs transactions to Google Calendar for a date range.
 * Automatically deletes existing WISEVEO events in the range first (replace behavior).
 */
export async function syncGoogleCalendar(
  userId: string,
  from: string,
  to: string,
  onProgress?: ProgressCallback,
): Promise<SyncResult> {
  const accessToken = await getValidAccessToken(userId)
  if (!accessToken) {
    throw new Error("Google Calendar não conectado")
  }

  // 1. Delete existing WISEVEO events in the range
  const deleted = await deleteWiseveoEvents(accessToken, from, to, onProgress)

  // 2. Compute opening balance
  const fromDate = startOfUTCDay(from)
  const toDate = endOfUTCDay(to)

  const [accounts, txBeforeAgg] = await Promise.all([
    prisma.account.findMany({
      where: { userId, active: true },
      select: { balance: true },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { userId, date: { lt: fromDate } },
    }),
  ])

  const initialSum = accounts.reduce(
    (sum, acc) => sum + safeBalance(acc.balance),
    0,
  )
  const openingBalanceTotal = initialSum + (txBeforeAgg._sum.amount ?? 0)

  // 3. Fetch transactions in range
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: fromDate, lte: toDate },
    },
    include: {
      category: { select: { name: true } },
      account: { select: { name: true } },
      statusLookup: { select: { name: true } },
      payee: { select: { name: true } },
    },
    orderBy: [{ date: "asc" }, { num: "asc" }],
  })

  // 4. Group by day
  const dailyMap = new Map<string, (typeof transactions)[number][]>()
  for (const tx of transactions) {
    const key = utcDateKey(tx.date)
    if (!dailyMap.has(key)) dailyMap.set(key, [])
    dailyMap.get(key)!.push(tx)
  }

  // 5. Build events: Saldo Inicial + transactions + Saldo Final per day
  const events: GoogleEvent[] = []
  let runningBalance = openingBalanceTotal

  const cursor = new Date(fromDate)
  cursor.setUTCHours(12, 0, 0, 0)
  const end = new Date(toDate)
  end.setUTCHours(12, 0, 0, 0)

  while (cursor <= end) {
    const key = utcDateKey(cursor)
    const dayTxs = dailyMap.get(key) ?? []

    if (dayTxs.length > 0) {
      const dateStr = key
      // Next day for all-day event end (Google requires exclusive end date)
      const nextDay = new Date(cursor)
      nextDay.setUTCDate(nextDay.getUTCDate() + 1)
      const endDateStr = utcDateKey(nextDay)

      // All-day events with numeric prefix for implicit ordering
      const totalEvents = dayTxs.length + 2 // +2 for Saldo Inicial/Final
      const pad = String(totalEvents).length // dynamic padding

      // Saldo Inicial (blue)
      events.push({
        summary: `${String(1).padStart(pad, "0")} - Saldo Inicial ${formatAmount(runningBalance)}`,
        description: WISEVEO_TAG,
        start: { date: dateStr },
        end: { date: endDateStr },
        colorId: "9",
      })

      // Individual transactions
      let txIdx = 2
      for (const tx of dayTxs) {
        const desc =
          tx.note || tx.description || tx.category?.name || "Transação"
        const summary = `${String(txIdx).padStart(pad, "0")} - ${desc} ${formatAmount(tx.amount)}`

        const statusRaw = tx.statusLookup?.name ?? "PENDING"
        const statusLabel = STATUS_MAP[statusRaw.toUpperCase()] ?? statusRaw

        const description = [
          `Categoria: ${tx.category?.name ?? "—"}`,
          `Conta: ${tx.account?.name ?? "—"}`,
          `Status: ${statusLabel}`,
          tx.payee ? `Beneficiário: ${tx.payee.name}` : null,
          `\n${WISEVEO_TAG}`,
        ]
          .filter(Boolean)
          .join("\n")

        events.push({
          summary,
          description,
          start: { date: dateStr },
          end: { date: endDateStr },
          colorId: TYPE_COLOR_ID[tx.type] ?? "8",
        })

        runningBalance += tx.amount
        txIdx++
      }

      // Saldo Final (blue)
      events.push({
        summary: `${String(txIdx).padStart(pad, "0")} - Saldo Final ${formatAmount(runningBalance)}`,
        description: WISEVEO_TAG,
        start: { date: dateStr },
        end: { date: endDateStr },
        colorId: "9",
      })
    } else {
      // No transactions — balance carries forward
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  // 6. Push events to Google Calendar
  let synced = 0
  let errors = 0
  onProgress?.(0, events.length, "Sincronizando eventos")

  for (const event of events) {
    try {
      const res = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        },
      )

      if (res.ok) {
        synced++
        onProgress?.(synced + errors, events.length, "Sincronizando eventos")
      } else {
        const errText = await res.text()
        console.error("[Google Calendar sync] Failed:", errText)
        errors++
        onProgress?.(synced + errors, events.length, "Sincronizando eventos")

        if (res.status === 403 || res.status === 401) {
          console.error(
            "[Google Calendar sync] Auth/permission error — aborting",
          )
          break
        }
      }
    } catch (err) {
      console.error("[Google Calendar sync] Error:", err)
      errors++
      onProgress?.(synced + errors, events.length, "Sincronizando eventos")
    }

    // Small delay to respect rate limits
    if ((synced + errors) % 10 === 0) {
      await new Promise((r) => setTimeout(r, 200))
    }
  }

  return { synced, errors, deleted }
}

/**
 * Clears ALL WISEVEO-tagged events from Google Calendar (no date restriction).
 */
export async function clearGoogleCalendarEvents(
  userId: string,
  onProgress?: ProgressCallback,
): Promise<{ deleted: number }> {
  const accessToken = await getValidAccessToken(userId)
  if (!accessToken) {
    throw new Error("Google Calendar não conectado")
  }

  const eventIds: string[] = []
  let pageToken: string | undefined

  // 1) List WISEVEO events across all pages
  do {
    const params = new URLSearchParams({
      maxResults: "250",
      singleEvents: "true",
    })
    if (pageToken) params.set("pageToken", pageToken)

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    )

    if (!res.ok) {
      const errText = await res.text()
      console.error("[Google Calendar clear] List failed:", errText)
      break
    }

    const data = await res.json()
    const items = data.items ?? []

    for (const item of items) {
      if (isWiseveoEvent(item) && item.id) {
        eventIds.push(item.id)
      }
    }

    pageToken = data.nextPageToken
  } while (pageToken)

  let deleted = 0
  const total = eventIds.length
  onProgress?.(0, total, "Limpando eventos")

  // 2) Delete and report progress
  for (let idx = 0; idx < eventIds.length; idx++) {
    const eventId = eventIds[idx]
    const delRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    )
    if (delRes.ok || delRes.status === 204) {
      deleted++
    }

    onProgress?.(idx + 1, total, "Limpando eventos")

    if ((idx + 1) % 10 === 0) {
      await new Promise((r) => setTimeout(r, 200))
    }
  }

  return { deleted }
}

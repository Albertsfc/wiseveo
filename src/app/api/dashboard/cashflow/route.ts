import { NextResponse, type NextRequest } from "next/server"

import { getAccountsWithBalance } from "@/features/accounts/services/get-accounts"
import { getDailyStatement } from "@/features/shared/services/get-daily-statement"
import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"

interface CashflowPoint {
  date: string
  income: number
  expense: number
  balance: number
}

function parseDateBoundary(value: string, endOfDay: boolean): Date | null {
  const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (dateMatch) {
    const [, y, m, d] = dateMatch
    const year = Number(y)
    const month = Number(m)
    const day = Number(d)

    return endOfDay
      ? new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
      : new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null

  return endOfDay
    ? new Date(
      Date.UTC(
        parsed.getUTCFullYear(),
        parsed.getUTCMonth(),
        parsed.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    )
    : new Date(
      Date.UTC(
        parsed.getUTCFullYear(),
        parsed.getUTCMonth(),
        parsed.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    )
}

function toDateKeyUtc(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")

  if (!fromParam || !toParam) {
    return NextResponse.json(
      { error: "Parâmetros 'from' e 'to' são obrigatórios" },
      { status: 400 },
    )
  }

  const from = parseDateBoundary(fromParam, false)
  const to = parseDateBoundary(toParam, true)

  if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json({ error: "Datas inválidas" }, { status: 400 })
  }

  if (from > to) {
    return NextResponse.json(
      { error: "Intervalo inválido: 'from' deve ser <= 'to'" },
      { status: 400 },
    )
  }

  const userId = await getDefaultUserId()

  if (!userId) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 401 })
  }

  const [statement, openingBalances] = await Promise.all([
    getDailyStatement(userId, from, to),
    getAccountsWithBalance(userId, new Date(from.getTime() - 1)),
  ])

  const byDay = new Map(statement.map((entry) => [entry.date, entry]))
  let runningBalance = openingBalances.reduce(
    (sum, account) => sum + account.currentBalance,
    0,
  )

  const start = startOfUtcDay(from)
  const end = startOfUtcDay(to)
  const points: CashflowPoint[] = []

  for (
    let cursor = start;
    cursor.getTime() <= end.getTime();
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)
  ) {
    const key = toDateKeyUtc(cursor)
    const day = byDay.get(key)

    const income = day?.income ?? 0
    const expense = day ? -day.expense : 0
    const net = day?.net ?? 0

    runningBalance += net

    points.push({
      date: key,
      income,
      expense,
      balance: runningBalance,
    })
  }

  return NextResponse.json({ points })
}

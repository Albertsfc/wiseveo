import { NextResponse, type NextRequest } from "next/server"
import { getTranslations } from "next-intl/server"

import { getUpcomingTransactions } from "@/features/dashboard/services/get-upcoming-transactions"
import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"

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

export async function GET(request: NextRequest) {
  const t = await getTranslations("api.errors")
  const { searchParams } = request.nextUrl
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")

  if (!fromParam || !toParam) {
    return NextResponse.json(
      { error: t("missingDateRange") },
      { status: 400 },
    )
  }

  const from = parseDateBoundary(fromParam, false)
  const to = parseDateBoundary(toParam, true)

  if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json({ error: t("invalidDates") }, { status: 400 })
  }

  if (from > to) {
    return NextResponse.json(
      { error: t("invalidDateRange") },
      { status: 400 },
    )
  }

  const userId = await getDefaultUserId()
  if (!userId) {
    return NextResponse.json({ error: t("userNotFound") }, { status: 401 })
  }

  const items = await getUpcomingTransactions(userId, from, to)

  return NextResponse.json({ items })
}

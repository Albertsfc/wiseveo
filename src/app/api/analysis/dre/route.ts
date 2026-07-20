import { NextResponse, type NextRequest } from "next/server"
import { getTranslations } from "next-intl/server"

import { endOfUTCDay, startOfUTCDay } from "@/lib/financial"
import { getDreData } from "@/features/analysis/services/get-dre-data"
import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"

function parseDateBoundary(value: string, endOfDay: boolean): Date | null {
  const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (dateMatch) {
    const [, y, m, d] = dateMatch
    const year = Number(y)
    const month = Number(m)
    const day = Number(d)
    const baseDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))

    return endOfDay ? endOfUTCDay(baseDate) : startOfUTCDay(baseDate)
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null

  return endOfDay ? endOfUTCDay(parsed) : startOfUTCDay(parsed)
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

  const dreData = await getDreData(userId, from, to)

  return NextResponse.json(dreData)
}

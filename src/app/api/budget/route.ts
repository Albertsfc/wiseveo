import { NextRequest, NextResponse } from "next/server"
import { getTranslations } from "next-intl/server"
import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"
import { getBudgetData } from "@/features/budget/services/get-budget-data"
import { startOfMonth, endOfMonth } from "date-fns"

export async function GET(req: NextRequest) {
  const t = await getTranslations("api.errors")
  try {
    const userId = await getDefaultUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const fromStr = searchParams.get("from")
    const toStr = searchParams.get("to")
    const dateStr = searchParams.get("date")
    
    // Fallback logic for from/to/date
    const fromRaw = fromStr
      ? new Date(fromStr)
      : (dateStr ? startOfMonth(new Date(dateStr)) : startOfMonth(new Date()))

    const toRaw = toStr
      ? new Date(toStr)
      : (dateStr ? endOfMonth(new Date(dateStr)) : endOfMonth(fromRaw))

    if (isNaN(fromRaw.getTime()) || isNaN(toRaw.getTime())) {
      return NextResponse.json({ error: t("invalidDateFormat") }, { status: 400 })
    }

    // Enforce full months regardless of what the client sends
    const from = startOfMonth(fromRaw)
    const to = endOfMonth(toRaw)

    const data = await getBudgetData(userId, from, to)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Budget API error:", error)
    return NextResponse.json(
      { error: t("internalError") },
      { status: 500 }
    )
  }
}

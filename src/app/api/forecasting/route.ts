import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getTranslations } from "next-intl/server"
import { getForecastingData } from "@/features/forecasting/services/get-forecasting-data"
import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"
import type { ForecastingModel } from "@/features/forecasting/services/forecasting-engine"

const querySchema = z.object({
  baseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mode: z.enum(["CAIXA", "COMPETENCIA"]),
  model: z.enum(["MOVING_AVERAGE", "STRAIGHT_LINE", "EXPONENTIAL_SMOOTHING"])
})

export async function GET(req: NextRequest) {
  const t = await getTranslations("api.errors")
  const userId = await getDefaultUserId()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse({
    baseDate: searchParams.get("baseDate"),
    mode: searchParams.get("mode"),
    model: searchParams.get("model")
  })

  if (!parsed.success) {
    return NextResponse.json({ error: t("invalidQueryParams"), details: parsed.error }, { status: 400 })
  }

    try {
    const { baseDate, mode, model } = parsed.data
    // Append T12:00:00Z to avoid timezone shifts
    const parsedDate = new Date(`${baseDate}T12:00:00Z`)
    
    const data = await getForecastingData(
      userId,
      parsedDate,
      mode,
      model as ForecastingModel
    )

    return NextResponse.json(data)
  } catch (err) {
    console.error("Forecasting API Error:", err)
    return NextResponse.json(
      { error: t("internalError") },
      { status: 500 }
    )
  }
}

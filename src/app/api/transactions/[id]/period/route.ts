import { NextResponse, type NextRequest } from "next/server"
import { getTranslations } from "next-intl/server"

import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"
import { updateTransactionPeriod } from "@/features/transactions/services/update-transaction-period"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getTranslations("api")
  const userId = await getDefaultUserId()
  if (!userId) {
    return NextResponse.json(
      { error: t("errors.userNotFound") },
      { status: 401 }
    )
  }

  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: t("errors.invalidJson") }, { status: 400 })
  }

  if (!body.period) {
    return NextResponse.json(
      { error: t("errors.missingField", { field: "period" }) },
      { status: 400 }
    )
  }

  try {
    const result = await updateTransactionPeriod(
      id,
      userId,
      String(body.period)
    )

    if (result && "error" in result) {
      return NextResponse.json(
        { error: t("errors.invalidPeriod") },
        { status: 400 }
      )
    }

    if (!result) {
      return NextResponse.json(
        { error: t("errors.transactionNotFound") },
        { status: 404 }
      )
    }

    return NextResponse.json({ transaction: result })
  } catch (error) {
    console.error("Error updating transaction period:", error)
    return NextResponse.json(
      { error: t("transactions.updatePeriodFailed") },
      { status: 500 }
    )
  }
}

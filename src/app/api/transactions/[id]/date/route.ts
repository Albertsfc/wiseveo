import { NextResponse, type NextRequest } from "next/server"
import { getTranslations } from "next-intl/server"

import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"
import { updateTransactionDate } from "@/features/transactions/services/update-transaction-date"

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

  if (!body.date) {
    return NextResponse.json(
      { error: t("errors.missingField", { field: "date" }) },
      { status: 400 }
    )
  }

  try {
    const transaction = await updateTransactionDate(id, userId, String(body.date))

    if (!transaction) {
      return NextResponse.json(
        { error: t("errors.transactionNotFound") },
        { status: 404 }
      )
    }

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error("Error updating transaction date:", error)
    return NextResponse.json(
      { error: t("transactions.updateDateFailed") },
      { status: 500 }
    )
  }
}

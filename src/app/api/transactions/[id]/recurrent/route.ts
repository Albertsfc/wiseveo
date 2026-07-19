import { NextResponse, type NextRequest } from "next/server"
import { getTranslations } from "next-intl/server"

import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"
import { makeRecurring } from "@/features/transactions/services/make-recurring"

export async function POST(
  _request: NextRequest,
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

  try {
    const recurring = await makeRecurring(id, userId)

    if (!recurring) {
      return NextResponse.json(
        { error: t("errors.transactionNotFound") },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, recurringTransaction: recurring })
  } catch (error) {
    console.error("Error creating recurring transaction:", error)
    return NextResponse.json(
      { error: t("transactions.recurrentFailed") },
      { status: 500 }
    )
  }
}

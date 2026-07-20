import { NextResponse, type NextRequest } from "next/server"
import { getTranslations } from "next-intl/server"

import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"
import { excludeTransaction } from "@/features/transactions/services/exclude-transaction"

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
    const result = await excludeTransaction(id, userId)

    if (!result) {
      return NextResponse.json(
        { error: t("errors.transactionNotFound") },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error excluding transaction:", error)
    return NextResponse.json(
      { error: t("transactions.excludeFailed") },
      { status: 500 }
    )
  }
}

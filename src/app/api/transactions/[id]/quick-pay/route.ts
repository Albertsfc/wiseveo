import { NextResponse, type NextRequest } from "next/server"

import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"
import { quickPayTransaction } from "@/features/transactions/services/quick-pay-transaction"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getDefaultUserId()
  if (!userId) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 401 }
    )
  }

  const { id } = await params

  try {
    const result = await quickPayTransaction(id, userId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error quick-paying transaction:", error)
    return NextResponse.json(
      { error: "Erro ao efetuar pagamento rápido" },
      { status: 500 }
    )
  }
}

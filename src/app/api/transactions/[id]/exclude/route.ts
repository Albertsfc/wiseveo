import { NextResponse, type NextRequest } from "next/server"

import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"
import { excludeTransaction } from "@/features/transactions/services/exclude-transaction"

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
    const result = await excludeTransaction(id, userId)

    if (!result) {
      return NextResponse.json(
        { error: "Transação não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error excluding transaction:", error)
    return NextResponse.json(
      { error: "Erro ao excluir transação" },
      { status: 500 }
    )
  }
}

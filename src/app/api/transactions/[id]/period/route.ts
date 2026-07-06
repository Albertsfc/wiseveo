import { NextResponse, type NextRequest } from "next/server"

import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"
import { updateTransactionPeriod } from "@/features/transactions/services/update-transaction-period"

export async function PATCH(
  request: NextRequest,
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

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  if (!body.period) {
    return NextResponse.json(
      { error: "Campo obrigatório: period" },
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
        { error: "Período inválido (esperado YYYYMM)" },
        { status: 400 }
      )
    }

    if (!result) {
      return NextResponse.json(
        { error: "Transação não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({ transaction: result })
  } catch (error) {
    console.error("Error updating transaction period:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar período da transação" },
      { status: 500 }
    )
  }
}

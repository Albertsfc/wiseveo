import { NextResponse, type NextRequest } from "next/server"

import { prisma } from "@/lib/prisma"
import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"

// DELETE /api/transactions/[id]/messages/[messageId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const userId = await getDefaultUserId()
  if (!userId) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 401 })
  }

  const { id: transactionId, messageId } = await params

  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
    select: { id: true },
  })

  if (!transaction) {
    return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 })
  }

  try {
    const deleted = await prisma.$queryRaw<Array<{ id: string }>>`
      DELETE FROM public.transaction_messages
      WHERE id = ${messageId}
        AND transaction_id = ${transactionId}
      RETURNING id
    `

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Mensagem não encontrada" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting transaction message:", error)
    return NextResponse.json({ error: "Erro ao apagar mensagem" }, { status: 500 })
  }
}

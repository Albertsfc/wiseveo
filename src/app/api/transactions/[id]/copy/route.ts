import { NextResponse, type NextRequest } from "next/server"

import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"
import { copyTransaction } from "@/features/transactions/services/copy-transaction"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getDefaultUserId()
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized or configuration not found" },
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

    if (!body.date) {
      return NextResponse.json(
        { error: "Campo obrigatório: date" },
        { status: 400 }
      )
    }

    await copyTransaction(id, String(body.date), userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Cópia de Transação]", error)
    return NextResponse.json(
      { error: "Failed to copy transaction: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    )
  }
}

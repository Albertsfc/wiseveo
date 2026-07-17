import { NextResponse } from "next/server"
import { getSessionUserId } from "@/lib/session"
import {
  AdminAccessError,
  approveUser,
  requireAdminUser,
} from "@/features/settings/services/admin-users-service"

export const dynamic = "force-dynamic"

function errorResponse(error: unknown) {
  if (error instanceof AdminAccessError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.status },
    )
  }

  const message =
    error instanceof Error ? error.message : "Erro interno do servidor"

  return NextResponse.json({ success: false, message }, { status: 500 })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminUser(await getSessionUserId())

    const body = await request.json().catch(() => null)
    if (body?.action !== "approve") {
      return NextResponse.json(
        { success: false, message: "Ação administrativa inválida" },
        { status: 400 },
      )
    }

    const { id } = await params
    const user = await approveUser(id)

    return NextResponse.json({
      success: true,
      message: "Usuário aprovado com sucesso.",
      data: user,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

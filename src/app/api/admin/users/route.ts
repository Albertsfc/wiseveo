import { NextResponse } from "next/server"
import { getSessionUserId } from "@/lib/session"
import {
  AdminAccessError,
  listUsersForAdmin,
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

  console.error("[GET /api/admin/users] erro:", error)

  return NextResponse.json(
    { success: false, message: "Erro interno do servidor" },
    { status: 500 },
  )
}

export async function GET() {
  try {
    await requireAdminUser(await getSessionUserId())
    const users = await listUsersForAdmin()

    return NextResponse.json({
      success: true,
      data: users,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

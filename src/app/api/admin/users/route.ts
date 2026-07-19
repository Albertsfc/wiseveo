import { NextResponse } from "next/server"
import { getTranslations } from "next-intl/server"
import { getSessionUserId } from "@/lib/session"
import {
  AdminAccessError,
  listUsersForAdmin,
  requireAdminUser,
} from "@/features/settings/services/admin-users-service"

export const dynamic = "force-dynamic"

async function errorResponse(error: unknown) {
  if (error instanceof AdminAccessError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.status },
    )
  }

  console.error("[GET /api/admin/users] error:", error)

  const t = await getTranslations("api.errors")

  return NextResponse.json(
    { success: false, message: t("internalError") },
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

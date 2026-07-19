import { NextResponse } from "next/server"
import { getTranslations } from "next-intl/server"
import { getSessionUserId } from "@/lib/session"
import {
  AdminAccessError,
  approveUser,
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

  const t = await getTranslations("api.errors")
  const message = error instanceof Error ? error.message : t("internalError")

  return NextResponse.json({ success: false, message }, { status: 500 })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const t = await getTranslations("api.admin")

  try {
    await requireAdminUser(await getSessionUserId())

    const body = await request.json().catch(() => null)
    if (body?.action !== "approve") {
      return NextResponse.json(
        { success: false, message: t("invalidAction") },
        { status: 400 },
      )
    }

    const { id } = await params
    const user = await approveUser(id)

    return NextResponse.json({
      success: true,
      message: t("userApproved"),
      data: user,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

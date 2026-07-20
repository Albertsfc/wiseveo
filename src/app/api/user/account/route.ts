import { NextResponse } from "next/server"
import { getTranslations } from "next-intl/server"
import { getSessionUserId } from "@/lib/session"
import { updateUserAccount } from "@/features/settings/services/user-settings-service"

export async function PUT(request: Request) {
  const t = await getTranslations("api")
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json(
      { success: false, message: t("errors.notAuthenticated") },
      { status: 401 }
    )
  }

  try {
    const data = await request.json()

    // Server-side password confirmation check
    if (data.newPassword && data.newPassword !== data.confirmPassword) {
      return NextResponse.json(
        { success: false, message: t("user.passwordMismatch") },
        { status: 400 }
      )
    }

    await updateUserAccount(userId, data)

    return NextResponse.json({
      success: true,
      message: t("user.accountUpdateSuccess"),
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    )
  }
}

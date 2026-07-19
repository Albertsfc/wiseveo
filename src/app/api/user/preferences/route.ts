import { NextResponse } from "next/server"
import { getTranslations } from "next-intl/server"
import {
  getUserAppearanceSettings,
  updateUserAppearance,
} from "@/features/settings/services/user-settings-service"
import { getSettingsUserId } from "@/features/settings/services/get-settings-user-id"
import { normalizeThemePreferences } from "@/lib/theme-preferences"

export const dynamic = "force-dynamic"

export async function GET() {
  const t = await getTranslations("api.errors")
  const userId = await getSettingsUserId()

  if (!userId) {
    return NextResponse.json(
      { success: false, message: t("userNotFound") },
      { status: 401 },
    )
  }

  const data = await getUserAppearanceSettings(userId)

  return NextResponse.json({
    success: true,
    data,
  })
}

export async function PUT(request: Request) {
  const t = await getTranslations("api.errors")
  const userId = await getSettingsUserId()

  if (!userId) {
    return NextResponse.json(
      { success: false, message: t("userNotFound") },
      { status: 401 },
    )
  }

  const body = await request.json()
  const data = await updateUserAppearance(
    userId,
    normalizeThemePreferences(body),
  )

  return NextResponse.json({
    success: true,
    data: data.themePreferences ?? null,
  })
}

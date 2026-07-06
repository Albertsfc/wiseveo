import { NextResponse } from "next/server"
import {
  getUserMonetarySettings,
  updateUserMonetarySettings,
} from "@/features/settings/services/user-settings-service"
import { getSettingsUserId } from "@/features/settings/services/get-settings-user-id"

export const dynamic = "force-dynamic"

async function getResolvedUserId() {
  return getSettingsUserId()
}

export async function GET() {
  const userId = await getResolvedUserId()
  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Usuário não encontrado" },
      { status: 401 },
    )
  }

  const data = await getUserMonetarySettings(userId)

  return NextResponse.json({
    success: true,
    data,
  })
}

export async function PUT(request: Request) {
  const userId = await getResolvedUserId()
  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Usuário não encontrado" },
      { status: 401 },
    )
  }

  const body = await request.json()
  const data = await updateUserMonetarySettings(userId, body)

  return NextResponse.json({
    success: true,
    data,
  })
}

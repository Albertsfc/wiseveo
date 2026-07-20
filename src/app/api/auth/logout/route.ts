import { NextResponse } from "next/server"
import { getTranslations } from "next-intl/server"
import { COOKIE_NAME } from "@/lib/auth"

export async function POST() {
  const t = await getTranslations("api.auth")
  const response = NextResponse.json(
    { success: true, message: t("logoutSuccess") },
    { status: 200 }
  )

  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  })

  return response
}

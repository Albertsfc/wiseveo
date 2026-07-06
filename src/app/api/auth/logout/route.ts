import { NextResponse } from "next/server"
import { COOKIE_NAME } from "@/lib/auth"

export async function POST() {
  const response = NextResponse.json(
    { success: true, message: "Logout realizado com sucesso" },
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

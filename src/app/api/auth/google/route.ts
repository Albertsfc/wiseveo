import { NextResponse } from "next/server"
import { generateState, getGoogleAuthUrl, isGoogleConfigured } from "@/lib/google-auth"

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  if (!isGoogleConfigured()) {
    return NextResponse.redirect(`${appUrl}/login?error=google_not_configured`)
  }

  const state = generateState()
  const authUrl = getGoogleAuthUrl(state)

  const response = NextResponse.redirect(authUrl)

  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  })

  return response
}

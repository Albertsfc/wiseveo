import { NextResponse } from "next/server"
import { generateState, getGoogleCalendarAuthUrl, isGoogleConfigured } from "@/lib/google-auth"
import { getSessionUserId } from "@/lib/session"

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  if (!isGoogleConfigured()) {
    return NextResponse.redirect(`${appUrl}/calendar?error=google_not_configured`)
  }

  const userId = await getSessionUserId()

  if (!userId) {
    return NextResponse.redirect(`${appUrl}/login`)
  }

  const state = generateState()
  const authUrl = getGoogleCalendarAuthUrl(state)

  const response = NextResponse.redirect(authUrl)

  response.cookies.set("google_calendar_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  })

  return response
}

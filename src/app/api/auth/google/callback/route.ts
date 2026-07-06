import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSessionToken, COOKIE_NAME } from "@/lib/auth"
import { exchangeCodeForTokens, decodeIdToken, isGoogleConfigured } from "@/lib/google-auth"
import {
  getInitialUserAccess,
  isActiveUser,
  isBootstrapAdminEmail,
  normalizeEmail,
  PENDING_APPROVAL_PATH,
} from "@/lib/user-approval"

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  if (!isGoogleConfigured()) {
    return NextResponse.redirect(`${appUrl}/login?error=google_not_configured`)
  }

  const { searchParams } = request.nextUrl
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  // User denied consent or error
  if (error) {
    return NextResponse.redirect(`${appUrl}/login?error=google_denied`)
  }

  // Validate state (CSRF protection)
  const savedState = request.cookies.get("google_oauth_state")?.value
  if (!state || !savedState || state !== savedState) {
    return NextResponse.redirect(`${appUrl}/login?error=invalid_state`)
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/login?error=no_code`)
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)
    const userInfo = decodeIdToken(tokens.id_token)
    const normalizedEmail = normalizeEmail(userInfo.email)

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: userInfo.sub },
          { email: normalizedEmail },
        ],
      },
    })

    if (user) {
      const bootstrapAdmin = isBootstrapAdminEmail(user.email)

      // Link Google account and persist OAuth tokens
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: user.googleId || userInfo.sub,
          photo: user.photo || userInfo.picture || null,
          ...(bootstrapAdmin
            ? {
                role: "SUPERADMIN",
                status: "ACTIVE",
              }
            : {}),
          googleAccessToken: tokens.access_token,
          googleRefreshToken:
            tokens.refresh_token ?? user.googleRefreshToken,
          googleTokenExpiresAt: new Date(
            Date.now() + tokens.expires_in * 1000,
          ),
        },
      })
    } else {
      const initialAccess = getInitialUserAccess(normalizedEmail)
      const userCount = await prisma.user.count()
      const isFirstUser = userCount === 0

      // Create new user (no password) with OAuth tokens
      user = await prisma.user.create({
        data: {
          name: userInfo.name,
          email: normalizedEmail,
          googleId: userInfo.sub,
          photo: userInfo.picture || null,
          role: isFirstUser ? "SUPERADMIN" : initialAccess.role,
          status: isFirstUser ? "ACTIVE" : initialAccess.status,
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token ?? null,
          googleTokenExpiresAt: new Date(
            Date.now() + tokens.expires_in * 1000,
          ),
        },
      })

      const { initializeUserData } = await import("@/lib/user-init")
      await initializeUserData(user.id)
    }

    if (!isActiveUser(user.status)) {
      const response = NextResponse.redirect(`${appUrl}${PENDING_APPROVAL_PATH}`)

      response.cookies.set("google_oauth_state", "", {
        httpOnly: true,
        maxAge: 0,
        path: "/",
      })

      return response
    }

    // Create session
    const token = await createSessionToken(user.id)

    const response = NextResponse.redirect(`${appUrl}/dashboard`)

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    // Clear OAuth state cookie
    response.cookies.set("google_oauth_state", "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
    })

    return response
  } catch (err) {
    console.error("[Google OAuth callback] error:", err)
    return NextResponse.redirect(`${appUrl}/login?error=google_failed`)
  }
}

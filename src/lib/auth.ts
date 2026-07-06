import { SignJWT, jwtVerify } from "jose"

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "fallback-secret-change-me"
)

const COOKIE_NAME = "session"

export async function createSessionToken(userId: string) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret)
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as { userId: string }
  } catch {
    return null
  }
}

export { COOKIE_NAME }

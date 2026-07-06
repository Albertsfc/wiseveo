import { cookies } from "next/headers"
import { verifySessionToken, COOKIE_NAME } from "./auth"

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  const session = await verifySessionToken(token)
  return session?.userId ?? null
}

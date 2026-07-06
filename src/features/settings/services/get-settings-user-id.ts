import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"
import { getSessionUserId } from "@/lib/session"

export async function getSettingsUserId() {
  const sessionUserId = await getSessionUserId()
  if (sessionUserId) {
    return sessionUserId
  }

  return getDefaultUserId()
}

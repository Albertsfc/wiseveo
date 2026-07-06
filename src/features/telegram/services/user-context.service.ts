export interface TelegramUserContext {
  userId: string
  name: string
  firstName: string
  email: string
  preferences: unknown
}

export function buildTelegramUserContext(input: {
  userId: string
  user: {
    name: string
    email: string
    preferencesJson?: unknown
  }
}): TelegramUserContext {
  const trimmedName = input.user.name.trim()
  return {
    userId: input.userId,
    name: trimmedName,
    firstName: trimmedName.split(/\s+/)[0] ?? "",
    email: input.user.email,
    preferences: input.user.preferencesJson ?? null,
  }
}

/**
 * Setup detection utilities.
 * Checks whether the WiseVeo setup wizard has been completed.
 * Used by middleware and layout to gate access appropriately.
 */

export function isSetupComplete(): boolean {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return true
  return process.env.WISEVEO_SETUP_COMPLETE === "true"
}

export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL
  if (!url) return false
  // Default Docker placeholder counts as "not configured" for setup detection
  const defaultPlaceholder = "postgresql://postgres:postgres@localhost:5432/wiseveo"
  return !url.startsWith(defaultPlaceholder)
}

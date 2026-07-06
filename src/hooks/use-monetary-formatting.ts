"use client"

import * as React from "react"
import {
  createMonetaryFormatter,
  defaultMonetarySettings,
} from "@/lib/monetary"
import {
  useMonetaryPreferences,
  useMonetaryPreferencesSafe,
} from "@/contexts/monetary-preferences-context"

export function useMonetaryFormatting() {
  const { preferences } = useMonetaryPreferences()

  return React.useMemo(
    () => createMonetaryFormatter(preferences),
    [preferences],
  )
}

export function useMonetaryFormattingSafe() {
  const context = useMonetaryPreferencesSafe()
  const preferences = context?.preferences ?? defaultMonetarySettings

  return React.useMemo(
    () => createMonetaryFormatter(preferences),
    [preferences],
  )
}

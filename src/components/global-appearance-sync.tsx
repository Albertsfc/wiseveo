"use client"

import * as React from "react"
import { useThemePreferences } from "@/contexts/theme-preferences-context"
import { useThemeManager } from "@/hooks/use-theme-manager"
import { resolveAppearanceStyles } from "@/lib/appearance"
import { getResolvedThemeMode } from "@/lib/theme-preferences"

export function GlobalAppearanceSync() {
  const { preferences } = useThemePreferences()
  const { applyRadius, applyStyleMap, isDarkMode, setTheme } = useThemeManager()

  const resolvedStyles = React.useMemo(
    () => resolveAppearanceStyles(preferences),
    [preferences],
  )
  const resolvedMode = React.useMemo(() => {
    const prefersDark =
      typeof window !== "undefined"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
        : isDarkMode

    return getResolvedThemeMode(preferences.themeMode, prefersDark)
  }, [preferences.themeMode, isDarkMode])

  React.useEffect(() => {
    setTheme(preferences.themeMode)
  }, [preferences.themeMode, setTheme])

  React.useEffect(() => {
    applyStyleMap(resolvedMode === "dark" ? resolvedStyles.dark : resolvedStyles.light)
    applyRadius(preferences.selectedRadius)
  }, [
    applyRadius,
    applyStyleMap,
    preferences.selectedRadius,
    resolvedMode,
    resolvedStyles.dark,
    resolvedStyles.light,
  ])

  return null
}

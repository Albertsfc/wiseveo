"use client"

import * as React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemePreferencesProvider } from "@/contexts/theme-preferences-context"
import { GlobalAppearanceSync } from "@/components/global-appearance-sync"
import {
  mergeThemePreferences,
  type ThemePreferences,
} from "@/lib/theme-preferences"

interface AppProvidersProps {
  children: React.ReactNode
  initialThemePreferences?: Partial<ThemePreferences> | null
}

export function AppProviders({
  children,
  initialThemePreferences,
}: AppProvidersProps) {
  const preferences = React.useMemo(
    () => mergeThemePreferences(initialThemePreferences),
    [initialThemePreferences],
  )

  return (
    <ThemeProvider defaultTheme={preferences.themeMode} storageKey="wiseveo-theme">
      <ThemePreferencesProvider initialPreferences={preferences}>
        <GlobalAppearanceSync />
        {children}
      </ThemePreferencesProvider>
    </ThemeProvider>
  )
}

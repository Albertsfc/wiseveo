"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/use-theme"
import { useCircularTransition } from "@/hooks/use-circular-transition"
import { useThemePreferencesSafe } from "@/contexts/theme-preferences-context"
import "./theme-customizer/circular-transition.css"

interface ModeToggleProps {
  variant?: "outline" | "ghost" | "default"
}

export function ModeToggle({ variant = "outline" }: ModeToggleProps) {
  const { theme } = useTheme()
  const { toggleTheme } = useCircularTransition()

  // Simple, reliable dark mode detection with re-sync
  const [isDarkMode, setIsDarkMode] = React.useState(false)

  React.useEffect(() => {
    const updateMode = () => {
      if (theme === "dark") {
        setIsDarkMode(true)
      } else if (theme === "light") {
        setIsDarkMode(false)
      } else {
        setIsDarkMode(typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches)
      }
    }

    updateMode()

    // Listen for system theme changes
    const mediaQuery = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null
    if (mediaQuery) {
      mediaQuery.addEventListener("change", updateMode)
    }

    return () => {
      if (mediaQuery) {
        mediaQuery.removeEventListener("change", updateMode)
      }
    }
  }, [theme])

  const themePrefs = useThemePreferencesSafe()

  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    // The new theme will be the opposite of current
    const newTheme = isDarkMode ? "light" : "dark"
    toggleTheme(event)
    themePrefs?.savePreferences({ themeMode: newTheme })
  }

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={handleToggle}
      className="cursor-pointer mode-toggle-button relative overflow-hidden"
    >
      {/* Show the icon for the mode you can switch TO */}
      {isDarkMode ? (
        <Sun className="h-[1.2rem] w-[1.2rem] transition-transform duration-300 rotate-0 scale-100" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] transition-transform duration-300 rotate-0 scale-100" />
      )}
      <span className="sr-only">
        Alternar para o modo {isDarkMode ? "claro" : "escuro"}
      </span>
    </Button>
  )
}

import type { Metadata } from "next"
import type { CSSProperties } from "react"
import { Geist, Geist_Mono } from "next/font/google"
import { AppProviders } from "@/components/app-providers"
import { getUserAppearanceSettings } from "@/features/settings/services/user-settings-service"
import { getSettingsUserId } from "@/features/settings/services/get-settings-user-id"
import {
  buildThemeBootstrapScript,
  getThemeStyleAttributes,
  mergeThemePreferences,
  type ThemePreferences,
} from "@/lib/theme-preferences"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, getLocale, getTranslations } from "next-intl/server"
import { getIntlLocale } from "@/i18n/format"
import { ZodLocaleSync } from "@/components/zod-locale-sync"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata")

  return {
    // Nome da marca: literal, idêntico em todos os idiomas (não é chave i18n)
    title: "WISEVEO",
    description: t("description"),
  }
}

async function getInitialThemePreferences(): Promise<ThemePreferences> {
  // During setup wizard, DB is not available yet — use defaults
  if (process.env.WISEVEO_SETUP_COMPLETE !== "true") {
    return mergeThemePreferences()
  }

  const userId = await getSettingsUserId()

  if (!userId) {
    return mergeThemePreferences()
  }

  return getUserAppearanceSettings(userId)
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const initialThemePreferences = await getInitialThemePreferences()
  const messages = await getMessages()
  const locale = await getLocale()

  const htmlClassName =
    initialThemePreferences.themeMode === "system"
      ? undefined
      : initialThemePreferences.themeMode
  const htmlStyle =
    initialThemePreferences.themeMode === "system"
      ? undefined
      : (getThemeStyleAttributes(
          initialThemePreferences,
          initialThemePreferences.themeMode,
        ) as CSSProperties)

  return (
    <html
      lang={getIntlLocale(locale)}
      suppressHydrationWarning
      className={htmlClassName}
      style={htmlStyle}
    >
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: buildThemeBootstrapScript(initialThemePreferences, "wiseveo-theme"),
          }}
        />
        <div id="wiseveo-app-root" className="contents">
          <AppProviders initialThemePreferences={initialThemePreferences}>
            <NextIntlClientProvider messages={messages}>
              <ZodLocaleSync />
              {children}
            </NextIntlClientProvider>
          </AppProviders>
        </div>
      </body>
    </html>
  )
}

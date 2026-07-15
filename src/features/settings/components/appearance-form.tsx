"use client"

import { ThemeCustomizerPanel } from "@/components/theme-customizer/panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LocaleSwitcher } from "@/components/locale-switcher"

import { useTranslations } from "next-intl"

export function AppearanceForm() {
  const t = useTranslations("settings.appearance")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("languageTitle")}</CardTitle>
          <CardDescription>
            {t("languageDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LocaleSwitcher />
        </CardContent>
      </Card>

      <ThemeCustomizerPanel description={t("customizerDesc")} />
    </div>
  )
}

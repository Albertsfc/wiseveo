"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { CalendarSync } from "lucide-react"

export function GoogleConnectButton() {
  const t = useTranslations("calendar")

  return (
    <Button
      variant="outline"
      className="w-full cursor-pointer"
      onClick={() => {
        window.location.href = "/api/calendar/connect-google"
      }}
    >
      <CalendarSync className="h-4 w-4 mr-2" />
      {t("connect.button")}
    </Button>
  )
}

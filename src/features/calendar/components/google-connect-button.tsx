"use client"

import { Button } from "@/components/ui/button"
import { CalendarSync } from "lucide-react"

export function GoogleConnectButton() {
  return (
    <Button
      variant="outline"
      className="w-full cursor-pointer"
      onClick={() => {
        window.location.href = "/api/calendar/connect-google"
      }}
    >
      <CalendarSync className="h-4 w-4 mr-2" />
      Conectar Google Calendar
    </Button>
  )
}

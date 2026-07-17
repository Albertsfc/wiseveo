"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Settings, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useSidebarConfig } from "@/contexts/sidebar-context"
import { ThemeCustomizerPanel } from "@/components/theme-customizer/panel"
import { cn } from "@/lib/utils"

interface ThemeCustomizerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ThemeCustomizer({ open, onOpenChange }: ThemeCustomizerProps) {
  const t = useTranslations("themeCustomizer")
  const { config: sidebarConfig } = useSidebarConfig()

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side={sidebarConfig.side === "left" ? "right" : "left"}
        className="flex w-[400px] flex-col gap-0 overflow-hidden p-0 pointer-events-auto [&>button]:hidden"
      >
        <SheetHeader className="space-y-0 p-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <Settings className="h-4 w-4" />
            </div>
            <SheetTitle className="text-lg font-semibold">{t("customizer")}</SheetTitle>
            <div className="ml-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <SheetDescription className="sr-only text-sm text-muted-foreground">
            {t("sheetDescription")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 pt-0">
          <ThemeCustomizerPanel description={t("panelDescription")} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function ThemeCustomizerTrigger({ onClick }: { onClick: () => void }) {
  const { config: sidebarConfig } = useSidebarConfig()

  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        "fixed top-1/2 z-50 h-12 w-12 -translate-y-1/2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 cursor-pointer",
        sidebarConfig.side === "left" ? "right-4" : "left-4",
      )}
    >
      <Settings className="h-5 w-5" />
    </Button>
  )
}

"use client"

import { useTranslations } from "next-intl"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useSidebarConfig } from "@/contexts/sidebar-context"
import { useSidebar } from "@/components/ui/sidebar"
import {
  sidebarCollapsibleOptions,
  sidebarSideOptions,
  sidebarVariants,
} from "@/config/theme-customizer-constants"
import { useThemePreferences } from "@/contexts/theme-preferences-context"

export function LayoutTab() {
  const t = useTranslations("themeCustomizer")
  const { config: sidebarConfig, updateConfig: updateSidebarConfig } = useSidebarConfig()
  const { toggleSidebar, state: sidebarState } = useSidebar()
  const { savePreferences } = useThemePreferences()

  const handleSidebarVariantSelect = (variant: "sidebar" | "floating" | "inset") => {
    updateSidebarConfig({ variant })
    savePreferences({ sidebarVariant: variant })
  }

  const handleSidebarCollapsibleSelect = (collapsible: "offcanvas" | "icon" | "none") => {
    updateSidebarConfig({ collapsible })
    savePreferences({ sidebarCollapsible: collapsible })

    if (collapsible === "icon" && sidebarState === "expanded") {
      toggleSidebar()
    }
  }

  const handleSidebarSideSelect = (side: "left" | "right") => {
    updateSidebarConfig({ side })
    savePreferences({ sidebarSide: side })
  }

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium">{t("sidebarVariantLabel")}</Label>
          {sidebarConfig.variant && (
            <p className="mt-1 text-xs text-muted-foreground">
              {sidebarConfig.variant === "sidebar" && t("sidebarVariantDesc.sidebar")}
              {sidebarConfig.variant === "floating" && t("sidebarVariantDesc.floating")}
              {sidebarConfig.variant === "inset" && t("sidebarVariantDesc.inset")}
            </p>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {sidebarVariants.map((variant) => (
            <button
              key={variant.value}
              type="button"
              className={`relative rounded-md border p-4 text-left transition-colors ${
                sidebarConfig.variant === variant.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-border/60"
              }`}
              onClick={() => handleSidebarVariantSelect(variant.value)}
            >
              <div className="space-y-2">
                <div className="text-center text-xs font-semibold">
                  {t(`sidebarVariant.${variant.name}` as never)}
                </div>
                <div className={`flex h-12 rounded border ${variant.value === "inset" ? "bg-muted" : "bg-background"}`}>
                  <div
                    className={`w-3 flex-shrink-0 bg-muted p-1 ${
                      variant.value === "floating" ? "m-1 rounded border-r" :
                      variant.value === "inset" ? "ms-0 m-1 rounded bg-muted/80" :
                      "border-r"
                    }`}
                  >
                    <div className="h-0.5 w-full rounded bg-foreground/60" />
                    <div className="mt-0.5 h-0.5 w-3/4 rounded bg-foreground/50" />
                    <div className="mt-0.5 h-0.5 w-2/3 rounded bg-foreground/40" />
                    <div className="mt-0.5 h-0.5 w-3/4 rounded bg-foreground/30" />
                  </div>
                  <div className={`m-1 flex-1 rounded-sm border border-dashed border-muted-foreground/20 ${variant.value === "inset" ? "ms-0 bg-background" : "bg-background/50"}`} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium">{t("sidebarCollapseLabel")}</Label>
          {sidebarConfig.collapsible && (
            <p className="mt-1 text-xs text-muted-foreground">
              {sidebarConfig.collapsible === "offcanvas" && t("sidebarCollapseDesc.offcanvas")}
              {sidebarConfig.collapsible === "icon" && t("sidebarCollapseDesc.icon")}
              {sidebarConfig.collapsible === "none" && t("sidebarCollapseDesc.none")}
            </p>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {sidebarCollapsibleOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`relative rounded-md border p-4 text-left transition-colors ${
                sidebarConfig.collapsible === option.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-border/60"
              }`}
              onClick={() => handleSidebarCollapsibleSelect(option.value)}
            >
              <div className="space-y-2">
                <div className="text-center text-xs font-semibold">
                  {t(`sidebarCollapsible.${option.name}` as never)}
                </div>
                <div className="flex h-12 rounded border bg-background">
                  {option.value === "offcanvas" ? (
                    <div className="m-1 flex flex-1 items-center justify-start rounded-sm border border-dashed border-muted-foreground/20 bg-background/50 pl-2">
                      <div className="flex flex-col gap-0.5">
                        <div className="h-0.5 w-3 rounded bg-foreground/60" />
                        <div className="h-0.5 w-3 rounded bg-foreground/60" />
                        <div className="h-0.5 w-3 rounded bg-foreground/60" />
                      </div>
                    </div>
                  ) : option.value === "icon" ? (
                    <>
                      <div className="w-4 flex-shrink-0 border-r bg-muted p-1">
                        <div className="mx-auto h-2 w-2 rounded-sm bg-foreground/60" />
                        <div className="mx-auto mt-1 h-2 w-2 rounded-sm bg-foreground/40" />
                        <div className="mx-auto mt-1 h-2 w-2 rounded-sm bg-foreground/30" />
                      </div>
                      <div className="m-1 flex-1 rounded-sm border border-dashed border-muted-foreground/20 bg-background/50" />
                    </>
                  ) : (
                    <>
                      <div className="w-6 flex-shrink-0 border-r bg-muted p-1">
                        <div className="h-0.5 w-full rounded bg-foreground/60" />
                        <div className="mt-0.5 h-0.5 w-3/4 rounded bg-foreground/50" />
                        <div className="mt-0.5 h-0.5 w-2/3 rounded bg-foreground/40" />
                        <div className="mt-0.5 h-0.5 w-3/4 rounded bg-foreground/30" />
                      </div>
                      <div className="m-1 flex-1 rounded-sm border border-dashed border-muted-foreground/20 bg-background/50" />
                    </>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium">{t("sidebarPositionLabel")}</Label>
          {sidebarConfig.side && (
            <p className="mt-1 text-xs text-muted-foreground">
              {sidebarConfig.side === "left" && t("sidebarPositionDesc.left")}
              {sidebarConfig.side === "right" && t("sidebarPositionDesc.right")}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {sidebarSideOptions.map((side) => (
            <button
              key={side.value}
              type="button"
              className={`relative rounded-md border p-4 text-left transition-colors ${
                sidebarConfig.side === side.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-border/60"
              }`}
              onClick={() => handleSidebarSideSelect(side.value)}
            >
              <div className="space-y-2">
                <div className="text-center text-xs font-semibold">
                  {t(`sidebarPosition.${side.name}` as never)}
                </div>
                <div className="flex h-12 rounded border bg-background">
                  {side.value === "left" ? (
                    <>
                      <div className="w-6 flex-shrink-0 border-r bg-muted p-1">
                        <div className="h-0.5 w-full rounded bg-foreground/60" />
                        <div className="mt-0.5 h-0.5 w-3/4 rounded bg-foreground/50" />
                        <div className="mt-0.5 h-0.5 w-2/3 rounded bg-foreground/40" />
                        <div className="mt-0.5 h-0.5 w-3/4 rounded bg-foreground/30" />
                      </div>
                      <div className="m-1 flex-1 rounded-sm border border-dashed border-muted-foreground/20 bg-background/50" />
                    </>
                  ) : (
                    <>
                      <div className="m-1 flex-1 rounded-sm border border-dashed border-muted-foreground/20 bg-background/50" />
                      <div className="w-6 flex-shrink-0 border-l bg-muted p-1">
                        <div className="h-0.5 w-full rounded bg-foreground/60" />
                        <div className="mt-0.5 h-0.5 w-3/4 rounded bg-foreground/50" />
                        <div className="mt-0.5 h-0.5 w-2/3 rounded bg-foreground/40" />
                        <div className="mt-0.5 h-0.5 w-3/4 rounded bg-foreground/30" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

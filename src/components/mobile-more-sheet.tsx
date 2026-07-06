"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Calendar,
  Calculator,
  LayoutPanelLeft,
  RotateCcw,
  Landmark,
  Settings,
  LineChart,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

// ─── Secondary nav items (shown in the "More" sheet) ─────────────────────────
interface SecondaryNavItem {
  label: string
  href: string
  icon: LucideIcon
  description?: string
}

const SECONDARY_NAV: SecondaryNavItem[] = [
  {
    label: "Insights",
    href: "/insights",
    icon: LayoutPanelLeft,
    description: "KPIs e análises financeiras",
  },
  {
    label: "Recorrentes",
    href: "/recurring",
    icon: RotateCcw,
    description: "Assinaturas e contas fixas",
  },
  {
    label: "Análise",
    href: "/analysis",
    icon: Calculator,
    description: "DRE e relatórios de período",
  },
  {
    label: "Forecasting",
    href: "/forecasting",
    icon: LineChart,
    description: "Projeções financeiras",
  },
  {
    label: "Bancos",
    href: "/banks",
    icon: Landmark,
    description: "Contas e saldos",
  },
  {
    label: "Configurações",
    href: "/configuracoes",
    icon: Settings,
    description: "Preferências do sistema",
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

interface MobileMoreSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * `MobileMoreSheet` — Bottom sheet with secondary navigation items.
 * Shown when the user taps "Mais" in the `MobileNav`.
 */
export function MobileMoreSheet({ open, onOpenChange }: MobileMoreSheetProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="pb-safe rounded-t-2xl max-h-[85dvh]"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Mais opções
          </SheetTitle>
        </SheetHeader>

        <nav aria-label="Navegação secundária">
          <ul className="flex flex-col gap-1" role="list">
            {SECONDARY_NAV.map((item) => {
              const active = isActive(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => onOpenChange(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg",
                      "touch-target transition-colors duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "flex items-center justify-center h-9 w-9 rounded-lg shrink-0",
                        active ? "bg-primary/15" : "bg-muted"
                      )}
                    >
                      <item.icon
                        className="h-4 w-4"
                        strokeWidth={active ? 2.5 : 2}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="flex flex-col min-w-0">
                      <span className={cn("text-sm font-medium leading-tight", active && "font-semibold")}>
                        {item.label}
                      </span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">
                          {item.description}
                        </span>
                      )}
                    </span>
                    {active && (
                      <span
                        aria-hidden="true"
                        className="ml-auto h-2 w-2 rounded-full bg-primary shrink-0"
                      />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  )
}

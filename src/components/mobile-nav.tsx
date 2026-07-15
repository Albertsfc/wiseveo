"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Calendar,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileMoreSheet } from "@/components/mobile-more-sheet"

import { useTranslations } from "next-intl"

// ─── Primary navigation items (max 5 for ergonomics) ─────────────────────────
interface NavItem {
  id: string
  href: string
  icon: LucideIcon
  /** Treat any path that starts with this prefix as active */
  matchPrefix?: string
}

const PRIMARY_NAV: NavItem[] = [
  { id: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { id: "transacoes", href: "/transactions", icon: ArrowLeftRight },
  { id: "orcamento", href: "/budget", icon: Wallet },
  { id: "calendario", href: "/calendar", icon: Calendar },
]

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * `MobileNav` — Bottom navigation bar for mobile devices (< 768px).
 *
 * Follows Google Material 3 and Apple HIG guidelines:
 * - 4 primary destinations + "more" trigger
 * - Minimum touch target 44×44px per WCAG 2.5.5
 * - Safe-area padding at the bottom (iPhone home indicator / Android nav bar)
 * - Active route highlighted with primary color indicator
 */
export function MobileNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = React.useState(false)
  const t = useTranslations("sidebar")

  function isActive(item: NavItem) {
    if (item.matchPrefix) return pathname.startsWith(item.matchPrefix)
    return pathname === item.href || pathname.startsWith(item.href + "/")
  }

  return (
    <>
      {/* Bottom navigation bar */}
      <nav
        aria-label={t("mainNavigation")}
        className={cn(
          // Positioning — fixed at the bottom, above safe-area
          "fixed bottom-0 inset-x-0 z-[30]",
          // Height: 4rem nav + safe area inset
          "pb-safe",
          // Visual
          "bg-background/95 backdrop-blur-md border-t border-border",
          // Only visible on mobile (< 768px)
          "md:hidden"
        )}
      >
        <div className="flex items-stretch h-16">
          {/* Primary nav items */}
          {PRIMARY_NAV.map((item) => {
            const active = isActive(item)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1",
                  "touch-target transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Active indicator pill */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-0 h-0.5 w-8 rounded-full transition-all duration-200",
                    active ? "bg-primary opacity-100" : "opacity-0"
                  )}
                />
                <item.icon
                  className={cn("h-5 w-5 transition-transform duration-150", active && "scale-110")}
                  strokeWidth={active ? 2.5 : 2}
                  aria-hidden="true"
                />
                <span className="text-[10px] font-medium leading-none tracking-tight">
                  {t(item.id)}
                </span>
              </Link>
            )
          })}

          {/* "More" trigger */}
          <button
            type="button"
            aria-label={t("moreOptions")}
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1",
              "touch-target transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              moreOpen
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MoreHorizontal
              className="h-5 w-5"
              strokeWidth={2}
              aria-hidden="true"
            />
            <span className="text-[10px] font-medium leading-none tracking-tight">
              {t("more")}
            </span>
          </button>
        </div>
      </nav>

      {/* More sheet */}
      <MobileMoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  )
}

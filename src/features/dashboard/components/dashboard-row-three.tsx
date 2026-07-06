"use client"

import * as React from "react"

import { DailyMovementCard } from "@/features/dashboard/components/daily-movement-card"
import { LatestTransactionsCard } from "@/features/dashboard/components/latest-transactions-card"
import { UpcomingTransactionsCard } from "@/features/dashboard/components/upcoming-transactions-card"

export function DashboardRowThree() {
  const leftColumnRef = React.useRef<HTMLDivElement | null>(null)
  const [leftHeight, setLeftHeight] = React.useState<number | null>(null)

  React.useEffect(() => {
    const node = leftColumnRef.current
    if (!node) return

    const updateHeight = () => {
      const next = Math.ceil(node.getBoundingClientRect().height)
      setLeftHeight((prev) => (prev === next ? prev : next))
    }

    updateHeight()

    const observer = new ResizeObserver(() => {
      updateHeight()
    })

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [])

  const heightMirrorStyle = leftHeight
    ? ({ "--row3-height": `${leftHeight}px` } as React.CSSProperties)
    : undefined

  return (
    // On mobile/tablet: single column stack.
    // On lg+: original 12-column split (6 + 6).
    <div className="grid grid-cols-1 lg:grid-cols-12 items-start gap-4">
      <div ref={leftColumnRef} className="col-span-1 lg:col-span-6">
        <DailyMovementCard />
      </div>

      <div
        className="col-span-1 lg:col-span-6 lg:h-[var(--row3-height)] lg:min-h-0 lg:overflow-hidden"
        style={heightMirrorStyle}
      >
        {/* On mobile: stack the two transaction cards vertically.
            On lg+: side-by-side 3+3 columns (original behavior). */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 items-stretch gap-4 lg:h-full lg:min-h-0">
          <div className="col-span-1 md:col-span-1 lg:col-span-3 lg:h-full lg:min-h-0">
            <LatestTransactionsCard />
          </div>
          <div className="col-span-1 md:col-span-1 lg:col-span-3 lg:h-full lg:min-h-0">
            <UpcomingTransactionsCard />
          </div>
        </div>
      </div>
    </div>
  )
}

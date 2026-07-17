"use client"

import * as React from "react"
import { addDays, startOfDay } from "date-fns"
import { useLocale, useTranslations } from "next-intl"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatAppDate } from "@/i18n/format"
import type { DateRange } from "@/contexts/date-range-context"

interface DayRangeNavigatorProps {
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
}

function weekdayLabel(date: Date, locale: string): string {
  const normalized = formatAppDate(date, "EEEE", locale)
  const trimmed = locale === "pt-BR" ? normalized.replace("-feira", "") : normalized
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

export function DayRangeNavigator({ dateRange, onDateRangeChange }: DayRangeNavigatorProps) {
  const t = useTranslations("transactions.dayNav")
  const locale = useLocale()
  const [focusedDate, setFocusedDate] = React.useState(() => startOfDay(dateRange.from))

  React.useEffect(() => {
    setFocusedDate(startOfDay(dateRange.from))
  }, [dateRange.from, dateRange.to])

  const applySingleDay = React.useCallback((date: Date) => {
    const singleDay = startOfDay(date)
    setFocusedDate(singleDay)
    onDateRangeChange({ from: singleDay, to: singleDay })
  }, [onDateRangeChange])

  const navigateDay = React.useCallback((direction: -1 | 1) => {
    applySingleDay(addDays(focusedDate, direction))
  }, [applySingleDay, focusedDate])

  return (
    <div className="flex items-center justify-center">
      <div className="bg-muted/40 border rounded-xl px-1.5 py-1.5 flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateDay(-1)}
          aria-label={t("previousDayAria")}
          className="h-7 w-7 cursor-pointer rounded-lg"
        >
          <ChevronLeft className="h-[15px] w-[15px]" />
        </Button>

        {([-1, 0, 1] as const).map((offset) => {
          const targetDate = addDays(focusedDate, offset)
          const isCenter = offset === 0

          return (
            <button
              key={offset}
              type="button"
              onClick={() => {
                if (!isCenter) applySingleDay(targetDate)
              }}
              className={cn(
                "min-w-[66px] h-[51px] rounded-lg border px-3 py-1.5 transition-colors",
                isCenter
                  ? "border-transparent bg-transparent text-primary shadow-none"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-background",
              )}
              aria-current={isCenter ? "date" : undefined}
            >
              <div className="grid h-full w-full grid-rows-[24px_10px] items-center justify-items-center">
                <span className={cn("font-bold leading-none", isCenter ? "text-[22.5px]" : "text-[17.5px]")}>
                  {formatAppDate(targetDate, "d", locale)}
                </span>
                <span className="text-[9px] font-medium leading-none">{weekdayLabel(targetDate, locale)}</span>
              </div>
            </button>
          )
        })}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateDay(1)}
          aria-label={t("nextDayAria")}
          className="h-7 w-7 cursor-pointer rounded-lg"
        >
          <ChevronRight className="h-[15px] w-[15px]" />
        </Button>
      </div>
    </div>
  )
}

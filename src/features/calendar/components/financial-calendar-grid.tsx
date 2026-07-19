"use client"

import { isSameMonth, isSameDay, isToday as isTodayFn } from "date-fns"
import { useLocale } from "next-intl"
import { getDateFnsLocale } from "@/i18n/format"
import { DayStatementCell } from "./day-statement-cell"
import type { CalendarDayStatement } from "../types"

interface FinancialCalendarGridProps {
  currentDate: Date
  calendarDays: Date[]
  daysMap: Map<string, CalendarDayStatement>
  selectedDate: Date | null
  onSelectDate: (date: Date) => void
}

function utcDateKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`
}

export function FinancialCalendarGrid({
  currentDate,
  calendarDays,
  daysMap,
  selectedDate,
  onSelectDate,
}: FinancialCalendarGridProps) {
  const locale = useLocale()
  const dateFnsLocale = getDateFnsLocale(locale)
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    dateFnsLocale.localize?.day(i as 0 | 1 | 2 | 3 | 4 | 5 | 6, { width: "short" }) ?? "",
  )

  return (
    <div className="flex-1 bg-background">
      {/* Header */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day, i) => (
          <div
            key={i}
            className="p-2 text-center font-medium text-sm text-muted-foreground border-r last:border-r-0 capitalize"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 flex-1">
        {calendarDays.map((day) => {
          const key = utcDateKey(day)
          const statement = daysMap.get(key)

          return (
            <DayStatementCell
              key={key}
              day={statement}
              dayNumber={day.getUTCDate()}
              isCurrentMonth={isSameMonth(day, currentDate)}
              isToday={isTodayFn(day)}
              isSelected={!!selectedDate && isSameDay(day, selectedDate)}
              onClick={() => onSelectDate(day)}
            />
          )
        })}
      </div>
    </div>
  )
}

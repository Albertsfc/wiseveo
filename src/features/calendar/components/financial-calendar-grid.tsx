"use client"

import { isSameMonth, isSameDay, isToday as isTodayFn } from "date-fns"
import { DayStatementCell } from "./day-statement-cell"
import type { CalendarDayStatement } from "../types"

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

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
  return (
    <div className="flex-1 bg-background">
      {/* Header */}
      <div className="grid grid-cols-7 border-b">
        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            className="p-2 text-center font-medium text-sm text-muted-foreground border-r last:border-r-0"
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

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  isWithinInterval,
  startOfDay,
  differenceInDays,
} from 'date-fns';
import { useLocale, useTranslations } from 'next-intl';
import { getDateFnsLocale, formatAppDate } from '@/i18n/format';
import { useDeviceClass } from '@/hooks/use-device-class';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface DatePickerProps {
  value: Date | { from: Date; to: Date };
  onChange: (value: Date | { from: Date; to: Date }) => void;
  mode?: 'single' | 'range';
  highlightDate?: Date;
}

function getPresetGroups(t: ReturnType<typeof useTranslations<'common.datePicker'>>) {
  return [
    {
      items: [
        { key: 'last3Months', label: t('last3Months') },
        { key: 'lastMonth', label: t('lastMonth') },
      ],
    },
    {
      items: [
        { key: 'lastWeek', label: t('lastWeek') },
        { key: 'today', label: t('today'), highlight: true },
        { key: 'thisWeek', label: t('thisWeek') },
        { key: 'thisMonth', label: t('thisMonth') },
        { key: 'fullMonth', label: t('fullMonth') },
      ],
    },
    {
      items: [
        { key: 'nextMonth', label: t('nextMonth') },
        { key: 'next3Months', label: t('next3Months') },
      ],
    },
  ];
}

const SINGLE_DROPDOWN_HEIGHT = 340;

export default function DatePicker({
  value,
  onChange,
  mode = 'range',
  highlightDate,
}: DatePickerProps) {
  const { isMobile } = useDeviceClass();
  const t = useTranslations('common.datePicker');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const dateFnsLocale = getDateFnsLocale(locale);
  const PRESET_GROUPS = getPresetGroups(t);
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    dateFnsLocale.localize?.day((i as 0 | 1 | 2 | 3 | 4 | 5 | 6), { width: 'narrow' }) ?? ''
  );
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [currentMonth, setCurrentMonth] = useState(
    mode === 'single'
      ? value instanceof Date
        ? value
        : new Date()
      : value && 'from' in value
        ? value.from
        : new Date()
  );

  const [tempRange, setTempRange] = useState<{
    from: Date;
    to: Date | null;
  } | null>(null);
  const [pendingDate, setPendingDate] = useState<Date | null>(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideTrigger = containerRef.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideTrigger && !insideDropdown) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on scroll
  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => setIsOpen(false);
    document.addEventListener('scroll', handleScroll, true);
    return () => document.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  const computeDropdownStyle = (): React.CSSProperties => {
    if (!triggerRef.current) return { position: 'fixed', top: 0, left: 0 };

    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const dropdownWidth = mode === 'single' ? 280 : 640;
    const dropdownHeight = mode === 'single' ? SINGLE_DROPDOWN_HEIGHT : 380;

    let left = rect.right - dropdownWidth;
    if (left < 8) left = 8;
    if (left + dropdownWidth > vw - 8) left = vw - dropdownWidth - 8;

    const spaceBelow = vh - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    let top: number;
    if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
      top = rect.bottom + 4;
    } else {
      top = rect.top - dropdownHeight - 4;
    }

    return { position: 'fixed', top, left, right: 'auto', zIndex: 9999 };
  };

  const handleOpen = () => {
    if (!isOpen) {
      setDropdownStyle(computeDropdownStyle());
    }
    setIsOpen((prev) => !prev);
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDayClick = (day: Date) => {
    setActivePreset(null);
    if (mode === 'single') {
      setPendingDate(day);
      return;
    }
    if (!tempRange || (tempRange.from && tempRange.to)) {
      setTempRange({ from: day, to: null });
    } else {
      const range =
        day < tempRange.from
          ? { from: day, to: tempRange.from }
          : { from: tempRange.from, to: day };
      setTempRange(null);
      onChange(range);
      setIsOpen(false);
    }
  };

  const applyPreset = (preset: string) => {
    const now = new Date();
    let range: { from: Date; to: Date } | null = null;

    switch (preset) {
      case 'last3Months': {
        const end = subMonths(now, 1);
        const start = subMonths(now, 3);
        range = { from: startOfMonth(start), to: endOfMonth(end) };
        break;
      }
      case 'lastMonth': {
        const m = subMonths(now, 1);
        range = { from: startOfMonth(m), to: endOfMonth(m) };
        break;
      }
      case 'lastWeek': {
        const lastSun = startOfWeek(now, { weekStartsOn: 0 });
        range = { from: lastSun, to: startOfDay(now) };
        break;
      }
      case 'today': {
        range = { from: startOfDay(now), to: startOfDay(now) };
        break;
      }
      case 'thisWeek': {
        const daysUntilSunday = now.getDay() === 0 ? 0 : 7 - now.getDay();
        const nextSun = addDays(startOfDay(now), daysUntilSunday);
        range = { from: startOfDay(now), to: nextSun };
        break;
      }
      case 'thisMonth': {
        range = { from: startOfDay(now), to: endOfMonth(now) };
        break;
      }
      case 'fullMonth': {
        range = { from: startOfMonth(now), to: endOfMonth(now) };
        break;
      }
      case 'nextMonth': {
        const m = addMonths(now, 1);
        range = { from: startOfMonth(m), to: endOfMonth(m) };
        break;
      }
      case 'next3Months': {
        const start = addMonths(now, 1);
        const end = addMonths(now, 3);
        range = { from: startOfMonth(start), to: endOfMonth(end) };
        break;
      }
    }

    if (range) {
      setActivePreset(preset);
      onChange(range);
      setCurrentMonth(range.from);
      setIsOpen(false);
    }
  };

  const renderCalendar = (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const rows: React.ReactElement[] = [];
    let days: React.ReactElement[] = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const isCurrentMonth = isSameMonth(currentDay, monthStart);

        const isSelected =
          mode === 'single'
            ? pendingDate
              ? isSameDay(currentDay, pendingDate)
              : value instanceof Date && isSameDay(currentDay, value)
            : tempRange
              ? isSameDay(currentDay, tempRange.from) ||
                (tempRange.to && isSameDay(currentDay, tempRange.to))
              : value &&
                'from' in value &&
                (isSameDay(currentDay, value.from) ||
                  isSameDay(currentDay, (value as { from: Date; to: Date }).to));

        const isInRange =
          mode === 'range' &&
          !isSelected &&
          (tempRange && tempRange.to
            ? isWithinInterval(currentDay, {
                start: tempRange.from,
                end: tempRange.to,
              })
            : value &&
              'from' in value &&
              isWithinInterval(currentDay, {
                start: value.from,
                end: (value as { from: Date; to: Date }).to,
              }));

        const isHighlighted =
          highlightDate && isSameDay(currentDay, highlightDate);
        const isToday = isSameDay(currentDay, new Date());

        days.push(
          <div
            key={currentDay.toString()}
            className={[
              'flex h-8 w-8 items-center justify-center rounded-md text-sm cursor-pointer transition-colors',
              !isCurrentMonth && 'text-muted-foreground/40',
              isCurrentMonth && !isSelected && !isInRange && 'hover:bg-accent hover:text-accent-foreground',
              isSelected && 'bg-primary text-primary-foreground font-medium',
              isInRange && 'bg-accent text-accent-foreground',
              isHighlighted && !isSelected && 'ring-2 ring-ring ring-offset-1 ring-offset-background',
              isToday && !isSelected && 'font-bold text-foreground',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => isCurrentMonth && handleDayClick(currentDay)}
          >
            {format(currentDay, 'd')}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-0.5" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="flex flex-col gap-2">
        <div className="text-center text-sm font-medium capitalize text-foreground">
          {formatAppDate(month, 'MMMM yyyy', locale)}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {weekDays.map((d, i) => (
            <div
              key={`${d}-${i}`}
              className="flex h-8 w-8 items-center justify-center text-xs font-medium text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>
        {rows}
      </div>
    );
  };

  const displayValue = () => {
    if (mode === 'single') {
      return value instanceof Date
        ? format(value, 'dd/MM/yyyy')
        : t('selectDate');
    }
    if (value && 'from' in value) {
      const v = value as { from: Date; to: Date };
      return `${format(v.from, 'dd/MM/yyyy')} – ${format(v.to, 'dd/MM/yyyy')}`;
    }
    return tCommon('selectPeriod');
  };

  const dayCount = (() => {
    if (mode !== 'range' || !(value && 'from' in value)) return null;
    const v = value as { from: Date; to: Date };
    return differenceInDays(v.to, v.from) + 1;
  })();

  const dropdownContent = (
    <div
      ref={dropdownRef}
      className={[
        'rounded-lg border border-border bg-popover text-popover-foreground shadow-lg',
        mode === 'single' ? 'w-[280px] p-3' : 'flex w-[640px]',
      ].join(' ')}
      style={dropdownStyle}
    >
      {/* Sidebar with presets */}
      {mode === 'range' && (
        <nav
          className="flex w-[160px] flex-col gap-1 border-r border-border p-3"
          aria-label={t('shortcutsAria')}
        >
          {PRESET_GROUPS.map((group, gi) => (
            <div key={gi} className="flex flex-col gap-0.5">
              {gi > 0 && <div className="my-1 h-px bg-border" />}
              {group.items.map(({ key, label, highlight }) => (
                <button
                  key={key}
                  type="button"
                  className={[
                    'rounded-md px-2.5 py-1.5 text-left text-xs transition-colors',
                    activePreset === key
                      ? 'bg-primary text-primary-foreground font-medium'
                      : highlight
                        ? 'font-medium text-foreground hover:bg-accent'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  ].join(' ')}
                  onClick={() => applyPreset(key)}
                  title={label}
                >
                  {label}
                </button>
              ))}
            </div>
          ))}
        </nav>
      )}

      {/* Main calendars area */}
      <div className="flex flex-1 flex-col">
        <div className="relative flex items-start gap-6 p-3">
          <button
            type="button"
            className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={handlePrevMonth}
            title={t('prevMonth')}
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex flex-1 justify-center gap-6">
            {renderCalendar(currentMonth)}
            {mode === 'range' && renderCalendar(addMonths(currentMonth, 1))}
          </div>

          <button
            type="button"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={handleNextMonth}
            title={t('nextMonth')}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-3 py-2">
          <button
            type="button"
            className="rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              setPendingDate(null);
              setIsOpen(false);
            }}
          >
            {tCommon('cancel')}
          </button>
          {mode === 'single' && (
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              disabled={!pendingDate}
              onClick={() => {
                if (pendingDate) {
                  onChange(pendingDate);
                  setPendingDate(null);
                  setIsOpen(false);
                }
              }}
            >
              {tCommon('confirm')}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ── Mobile: Sheet bottom ──────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div ref={containerRef}>
        {/* Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          onClick={() => setIsOpen(true)}
          aria-label={t('openPicker')}
        >
          <CalendarIcon size={14} className="text-muted-foreground" />
          <span>{displayValue()}</span>
          {dayCount !== null && dayCount > 1 && (
            <span className="ml-1 flex h-5 items-center rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
              {t('dayCountBadge', { count: dayCount })}
            </span>
          )}
        </button>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="bottom" className="h-auto max-h-[90dvh] flex flex-col gap-0 pb-safe px-0">
            <SheetHeader className="px-4 pt-4 pb-3 border-b">
              <SheetTitle className="text-sm font-semibold">
                {mode === 'single' ? t('selectDate') : tCommon('selectPeriod')}
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {/* Presets em lista (mobile) */}
              {mode === 'range' && (
                <div className="px-4 py-3 border-b">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">{t('shortcuts')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_GROUPS.flatMap(g => g.items).map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        className={[
                          'rounded-full px-3 py-1 text-xs transition-colors border',
                          activePreset === key
                            ? 'bg-primary text-primary-foreground border-primary font-medium'
                            : 'border-border text-muted-foreground hover:bg-accent',
                        ].join(' ')}
                        onClick={() => applyPreset(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Calendário único centralizado */}
              <div className="px-4 py-4">
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent"
                    onClick={handlePrevMonth}
                    title={t('prevMonth')}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-medium capitalize">
                    {formatAppDate(currentMonth, 'MMMM yyyy', locale)}
                  </span>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent"
                    onClick={handleNextMonth}
                    title={t('nextMonth')}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                {/* Grid do calendário — sem o header de mês (já temos acima) */}
                {(() => {
                  const monthStart = startOfMonth(currentMonth);
                  const monthEnd = endOfMonth(monthStart);
                  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
                  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
                  const rows: React.ReactElement[] = [];
                  let days: React.ReactElement[] = [];
                  let day = startDate;

                  while (day <= endDate) {
                    for (let i = 0; i < 7; i++) {
                      const currentDay = day;
                      const isCurrentMonth = isSameMonth(currentDay, monthStart);
                      const isSelected =
                        mode === 'single'
                          ? pendingDate
                            ? isSameDay(currentDay, pendingDate)
                            : value instanceof Date && isSameDay(currentDay, value)
                          : tempRange
                            ? isSameDay(currentDay, tempRange.from) ||
                              (tempRange.to && isSameDay(currentDay, tempRange.to))
                            : value &&
                              'from' in value &&
                              (isSameDay(currentDay, value.from) ||
                                isSameDay(currentDay, (value as { from: Date; to: Date }).to));
                      const isInRange =
                        mode === 'range' &&
                        !isSelected &&
                        (tempRange && tempRange.to
                          ? isWithinInterval(currentDay, { start: tempRange.from, end: tempRange.to })
                          : value &&
                            'from' in value &&
                            isWithinInterval(currentDay, {
                              start: value.from,
                              end: (value as { from: Date; to: Date }).to,
                            }));
                      const isToday = isSameDay(currentDay, new Date());

                      days.push(
                        <div
                          key={currentDay.toString()}
                          className={[
                            'flex h-10 w-10 items-center justify-center rounded-md text-sm cursor-pointer transition-colors touch-target',
                            !isCurrentMonth && 'text-muted-foreground/40',
                            isCurrentMonth && !isSelected && !isInRange && 'hover:bg-accent hover:text-accent-foreground',
                            isSelected && 'bg-primary text-primary-foreground font-medium',
                            isInRange && 'bg-accent text-accent-foreground',
                            isToday && !isSelected && 'font-bold text-foreground',
                          ].filter(Boolean).join(' ')}
                          onClick={() => isCurrentMonth && handleDayClick(currentDay)}
                        >
                          {format(currentDay, 'd')}
                        </div>
                      );
                      day = addDays(day, 1);
                    }
                    rows.push(
                      <div className="grid grid-cols-7 gap-0.5" key={day.toString()}>{days}</div>
                    );
                    days = [];
                  }

                  return (
                    <>
                      <div className="grid grid-cols-7 gap-0.5 mb-1">
                        {weekDays.map((d, i) => (
                          <div key={`${d}-${i}`} className="flex h-8 w-10 items-center justify-center text-xs font-medium text-muted-foreground">
                            {d}
                          </div>
                        ))}
                      </div>
                      {rows}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
              <button
                type="button"
                className="rounded-md px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent"
                onClick={() => {
                  setPendingDate(null);
                  setIsOpen(false);
                }}
              >
                {tCommon('cancel')}
              </button>
              {mode === 'single' && (
                <button
                  type="button"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  disabled={!pendingDate}
                  onClick={() => {
                    if (pendingDate) {
                      onChange(pendingDate);
                      setPendingDate(null);
                      setIsOpen(false);
                    }
                  }}
                >
                  {tCommon('confirm')}
                </button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // ── Desktop / Tablet: dropdown via portal ─────────────────────────────────
  return (
    <div ref={containerRef}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        onClick={handleOpen}
        aria-label={t('openPicker')}
      >
        <CalendarIcon size={14} className="text-muted-foreground" />
        <span className="hidden sm:inline">{displayValue()}</span>
        <span className="sm:hidden">
          <CalendarIcon size={14} />
        </span>
        {dayCount !== null && dayCount > 1 && (
          <span className="ml-1 flex h-5 items-center rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            {t('dayCountBadge', { count: dayCount })}
          </span>
        )}
      </button>

      {/* Dropdown via portal */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(dropdownContent, document.body)}
    </div>
  );
}

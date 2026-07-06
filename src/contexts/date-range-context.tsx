'use client';

import React, { createContext, useContext } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';
import { usePathname } from 'next/navigation';

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeContextType {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
}

const DateRangeContext = createContext<DateRangeContextType | null>(null);

const STORAGE_KEY_PREFIX = 'wiseveo-date-filters';
const LEGACY_STORAGE_KEY = 'wiseveo-date-filters';
const FALLBACK_SCOPE = 'global';

function getDefaultDateRange(): DateRange {
  return {
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  };
}

function buildStorageKey(scopeKey: string): string {
  return `${STORAGE_KEY_PREFIX}:${encodeURIComponent(scopeKey)}`;
}

function parseStoredDateRange(raw: string | null): DateRange | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { from?: string; to?: string };
    if (!parsed.from || !parsed.to) return null;

    const from = new Date(parsed.from);
    const to = new Date(parsed.to);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;

    return { from, to };
  } catch {
    return null;
  }
}

function resolveDateRangeScope(pathname: string | null, scopeKey?: string): string {
  if (scopeKey && scopeKey.trim().length > 0) {
    return scopeKey.trim();
  }

  if (!pathname || pathname.trim().length === 0) {
    return FALLBACK_SCOPE;
  }

  return pathname;
}

interface DateRangeProviderProps {
  children: React.ReactNode;
  scopeKey?: string;
}

export function DateRangeProvider({ children, scopeKey }: DateRangeProviderProps) {
  const pathname = usePathname();
  const resolvedScope = React.useMemo(
    () => resolveDateRangeScope(pathname, scopeKey),
    [pathname, scopeKey],
  );
  const storageKey = React.useMemo(() => buildStorageKey(resolvedScope), [resolvedScope]);

  const [dateRange, setDateRange] = React.useState<DateRange>(getDefaultDateRange);
  const isHydratingScope = React.useRef(true);

  // Load from local storage on mount and whenever page scope changes
  React.useEffect(() => {
    isHydratingScope.current = true;
    try {
      const persisted = parseStoredDateRange(localStorage.getItem(storageKey));
      if (persisted) {
        setDateRange(persisted);
        return;
      }

      const legacy = parseStoredDateRange(localStorage.getItem(LEGACY_STORAGE_KEY));
      if (legacy) {
        setDateRange(legacy);
        localStorage.setItem(storageKey, JSON.stringify({
          from: legacy.from.toISOString(),
          to: legacy.to.toISOString(),
        }));
        return;
      }

      setDateRange(getDefaultDateRange());
    } catch (e) {
      console.error('Failed to parse date range from local storage', e);
      setDateRange(getDefaultDateRange());
    } finally {
      isHydratingScope.current = false;
    }
  }, [storageKey]);

  // Save to local storage when state changes
  React.useEffect(() => {
    if (isHydratingScope.current) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString()
      }));
    } catch (e) {
      console.error('Failed to save date range to local storage', e);
    }
  }, [dateRange, storageKey]);

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error('useDateRange must be used within a DateRangeProvider');
  }
  return context;
}

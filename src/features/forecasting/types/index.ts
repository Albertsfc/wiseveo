import type { ForecastingModel } from "../services/forecasting-engine"

export interface ForecastingCell {
  amount: number
  isProjected: boolean
  avPercentage: number
  ahPercentage: number
}

export interface ForecastingCategory {
  code: string
  name: string
  cells: ForecastingCell[]
}

export interface ForecastingGroup {
  code: string
  name: string
  categories: ForecastingCategory[]
  cells: ForecastingCell[]
}

export interface ForecastingSection {
  name: string
  groups: ForecastingGroup[]
  cells: ForecastingCell[]
}

export interface ForecastingColumn {
  monthKey: string // "2026-05" or "202605"
  label: string    // "MAI-26"
  isProjected: boolean
}

export interface ForecastingData {
  columns: ForecastingColumn[]
  income: ForecastingSection
  expense: ForecastingSection
  netResultCells: ForecastingCell[]
  accumulatedCells: ForecastingCell[]
}

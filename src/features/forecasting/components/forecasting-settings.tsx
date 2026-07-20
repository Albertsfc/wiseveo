"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { CalendarIcon, TrendingUp, Settings2 } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"

export function ForecastingSettings() {
  const t = useTranslations("forecasting.settings")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const baseDate = searchParams.get("baseDate") || new Date().toISOString().slice(0, 7)
  const mode = searchParams.get("mode") || "CAIXA"
  const model = searchParams.get("model") || "MOVING_AVERAGE"
  const showAv = searchParams.get("showAv") !== "false"
  const showAh = searchParams.get("showAh") !== "false"

  const createQueryString = React.useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const handleParamChange = (name: string, value: string) => {
    router.push(pathname + "?" + createQueryString(name, value), { scroll: false })
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {/* Base Month Selector */}
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <Label htmlFor="baseMonth" className="text-xs text-muted-foreground">{t("baseMonthLabel")}</Label>
            <Input
              id="baseMonth"
              type="month"
              value={baseDate}
              onChange={(e) => handleParamChange("baseDate", e.target.value)}
              className="h-8 w-[160px]"
            />
          </div>
        </div>

        {/* Model Selector */}
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <Label htmlFor="modelSelect" className="text-xs text-muted-foreground">{t("modelLabel")}</Label>
            <Select value={model} onValueChange={(val) => handleParamChange("model", val)}>
              <SelectTrigger id="modelSelect" className="h-8 w-[200px]">
                <SelectValue placeholder={t("modelPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MOVING_AVERAGE">{t("modelOptions.movingAverage")}</SelectItem>
                <SelectItem value="STRAIGHT_LINE">{t("modelOptions.straightLine")}</SelectItem>
                <SelectItem value="EXPONENTIAL_SMOOTHING">{t("modelOptions.exponentialSmoothing")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <Label htmlFor="modeSelect" className="text-xs text-muted-foreground">{t("modeLabel")}</Label>
            <Select value={mode} onValueChange={(val) => handleParamChange("mode", val)}>
              <SelectTrigger id="modeSelect" className="h-8 w-[140px]">
                <SelectValue placeholder={t("modePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CAIXA">{t("modeOptions.cash")}</SelectItem>
                <SelectItem value="COMPETENCIA">{t("modeOptions.accrual")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch
            id="show-av"
            checked={showAv}
            onCheckedChange={(c) => handleParamChange("showAv", c ? "true" : "false")}
          />
          <Label htmlFor="show-av" className="text-sm">{t("showAvLabel")}</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="show-ah"
            checked={showAh}
            onCheckedChange={(c) => handleParamChange("showAh", c ? "true" : "false")}
          />
          <Label htmlFor="show-ah" className="text-sm">{t("showAhLabel")}</Label>
        </div>
      </div>
    </div>
  )
}

"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ColorPickerProps {
  label: string
  cssVar: string
  value: string
  onChange: (cssVar: string, value: string) => void
}

export function ColorPicker({ label, cssVar, value, onChange }: ColorPickerProps) {
  const [localValue, setLocalValue] = React.useState(value)

  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setLocalValue(newColor)
    onChange(cssVar, newColor)
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    onChange(cssVar, newValue)
  }

  const resolveColorToHex = React.useCallback((colorValue: string) => {
    if (!colorValue || typeof document === "undefined") {
      return "#000000"
    }

    if (colorValue.startsWith("#")) {
      return colorValue
    }

    const probe = document.createElement("span")
    probe.style.color = colorValue
    document.body.appendChild(probe)
    const computed = getComputedStyle(probe).color
    document.body.removeChild(probe)

    const match = computed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (!match) {
      return "#000000"
    }

    const [red, green, blue] = match.slice(1, 4).map((channel) =>
      Number(channel).toString(16).padStart(2, "0"),
    )

    return `#${red}${green}${blue}`
  }, [])

  const displayColor = React.useMemo(() => {
    if (typeof document === "undefined") {
      return "#000000"
    }

    const computed = getComputedStyle(document.documentElement)
      .getPropertyValue(cssVar)
      .trim()

    return resolveColorToHex(localValue || computed)
  }, [cssVar, localValue, resolveColorToHex])

  return (
    <div className="space-y-2">
      <Label htmlFor={`color-${cssVar}`} className="text-xs font-medium">
        {label}
      </Label>
      <div className="flex items-start gap-2">
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            className="h-8 w-8 p-0 overflow-hidden cursor-pointer"
            style={{ backgroundColor: displayColor }}
          >
            <input
              type="color"
              id={`color-${cssVar}`}
              value={displayColor}
              onChange={handleColorChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </Button>
        </div>
        <Input
          type="text"
          placeholder={`${cssVar} value`}
          value={localValue}
          onChange={handleTextChange}
          className="h-8 text-xs flex-1"
        />
      </div>
    </div>
  )
}

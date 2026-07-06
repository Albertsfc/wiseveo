"use client"

import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface ProgressWithLabelProps {
  value: number
  label: string
  className?: string
}

export function ProgressWithLabel({
  value,
  label,
  className,
}: ProgressWithLabelProps) {
  return (
    <div className={cn("w-full space-y-1.5", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{Math.round(value)}%</span>
      </div>
      <Progress value={value} />
    </div>
  )
}

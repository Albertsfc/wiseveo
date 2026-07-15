"use client"

import * as React from "react"
import { format } from "date-fns"
import { Bar, BarChart, XAxis, YAxis, Cell, LabelList } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart"
import { useDateRange } from "@/contexts/date-range-context"
import { useMonetaryFormattingSafe } from "@/hooks/use-monetary-formatting"
import { useDeviceClass } from "@/hooks/use-device-class"

interface ExpenseGroupItem {
  groupCode: string
  groupName: string
  amount: number
  paid: number
  scheduled: number
  percentage: number
}

interface ChartDataPoint {
  group: string
  amount: number
  paid: number
  scheduled: number
  percentage: number
  fill: string
}

const BAR_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--destructive)",
  "var(--primary)",
]

import { useTranslations } from "next-intl"

function buildChartConfig(data: ChartDataPoint[], label: string): ChartConfig {
  const config: ChartConfig = {
    amount: { label },
  }

  for (const item of data) {
    const key = item.group
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "_")

    config[key] = {
      label: item.group,
      color: item.fill,
    }
  }

  return config
}

interface ExpenseTooltipPayloadItem {
  name?: unknown
  value?: unknown
  payload?: ChartDataPoint
}

interface ExpenseTooltipProps {
  active?: boolean
  payload?: ExpenseTooltipPayloadItem[]
}

function ExpenseTooltipContent({ active, payload }: ExpenseTooltipProps) {
  const monetary = useMonetaryFormattingSafe()
  const t = useTranslations("dashboard.ExpensesChart")

  if (!active || !payload?.length) return null

  // The payload will contain multiple items if stacked. 
  // We want the total data which is usually in the payload of any of the items.
  const data = payload[0]?.payload
  if (!data) return null

  return (
    <div className="border-border/50 bg-background/75 text-card-foreground grid min-w-[200px] items-start gap-1.5 rounded-xl border px-3 py-2 text-xs shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1 mb-1">
        <p className="text-foreground font-semibold">{data.group}</p>
        <span className="text-muted-foreground font-medium">{data.percentage.toFixed(1)}%</span>
      </div>
      
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: data.fill }}
            />
            {t("paid")}
          </span>
          <span className="text-foreground font-mono font-medium tabular-nums">
            {monetary.formatMonetaryValue(data.paid)}
          </span>
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span
              className="size-2 shrink-0 rounded-full opacity-35"
              style={{ backgroundColor: data.fill }}
            />
            {t("toPay")}
          </span>
          <span className="text-foreground font-mono font-medium tabular-nums">
            {monetary.formatMonetaryValue(data.scheduled)}
          </span>
        </div>

        <div className="mt-0.5 flex items-center justify-between gap-4 border-t border-border/50 pt-1">
          <span className="text-foreground font-medium">{t("total")}</span>
          <span className="text-foreground font-mono font-bold tabular-nums">
            {monetary.formatMonetaryValue(data.amount)}
          </span>
        </div>
      </div>
    </div>
  )
}

function CustomBarLabel(props: any) {
  const { x, y, width, height, value, index, data } = props
  if (!data || !data[index]) return null

  const item = data[index] as ChartDataPoint
  const barCenterY = y + height / 2
  const padding = 8

  const labelFits = width > 60

  if (!labelFits) {
    return (
      <text
        x={x + width + 6}
        y={barCenterY}
        dominantBaseline="central"
        className="fill-foreground text-[10px] font-medium"
      >
        {item.group}
      </text>
    )
  }

  return (
    <text
      x={x + padding}
      y={barCenterY}
      dominantBaseline="central"
      className="text-[10px] font-medium"
      fill="white"
    >
      {item.group}
    </text>
  )
}

export function ExpensesByGroupChart() {
  const monetary = useMonetaryFormattingSafe()
  const { dateRange } = useDateRange()
  const { isMobile } = useDeviceClass()
  const [data, setData] = React.useState<ChartDataPoint[]>([])
  const [totalExpense, setTotalExpense] = React.useState(0)
  const [loading, setLoading] = React.useState(false)

  const t = useTranslations("dashboard.ExpensesChart")
  const tSectionCards = useTranslations("dashboard.SectionCards")

  // Dynamic height: taller per bar on mobile (48px) vs desktop (40px)
  const barHeightPx = isMobile ? 52 : 40
  const minHeight = isMobile ? 200 : 280
  const chartHeight = Math.max(minHeight, data.length * barHeightPx)

  React.useEffect(() => {
    let isCancelled = false

    async function fetchData() {
      setLoading(true)

      try {
        const params = new URLSearchParams({
          from: format(dateRange.from, "yyyy-MM-dd"),
          to: format(dateRange.to, "yyyy-MM-dd"),
        })

        const res = await fetch(
          `/api/dashboard/expenses-by-group?${params.toString()}`,
        )

        if (!res.ok) throw new Error("Falha ao carregar despesas por grupo")

        const payload = (await res.json()) as {
          groups: ExpenseGroupItem[]
          totalExpense: number
        }

        if (!isCancelled) {
          const chartData: ChartDataPoint[] = payload.groups.map(
            (g, idx) => ({
              group: g.groupName,
              amount: g.amount,
              paid: g.paid,
              scheduled: g.scheduled,
              percentage: g.percentage,
              fill: BAR_COLORS[idx % BAR_COLORS.length],
            }),
          )

          setData(chartData)
          setTotalExpense(payload.totalExpense)
        }
      } catch (err) {
        console.error("Failed to fetch expenses by group:", err)
        if (!isCancelled) {
          setData([])
          setTotalExpense(0)
        }
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetchData()
    return () => {
      isCancelled = true
    }
  }, [dateRange.from, dateRange.to])

  const chartConfig = React.useMemo(() => buildChartConfig(data, tSectionCards("expense")), [data, tSectionCards])

  return (
    <Card className="@container/card h-full bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t("totalExpenses")}{" "}
          <span className="font-mono tabular-nums text-foreground text-destructive">
            {monetary.formatMonetaryValue(Math.abs(totalExpense))}
          </span>
        </p>

        {loading ? (
          <div className="flex items-center justify-center" style={{ height: minHeight }}>
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center" style={{ height: minHeight }}>
            <p className="text-sm text-muted-foreground">
              {t("noExpenses")}
            </p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="w-full"
            style={{ height: chartHeight }}
          >
            <BarChart
              accessibilityLayer
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              barCategoryGap="16%"
            >
              <YAxis
                dataKey="group"
                type="category"
                hide
              />
              <XAxis 
                dataKey="amount" 
                type="number" 
                hide 
                domain={[0, "dataMax"]}
              />
              <ChartTooltip
                cursor={false}
                content={<ExpenseTooltipContent />}
              />
              <Bar 
                dataKey="paid" 
                stackId="a" 
                radius={[0, 0, 0, 0]} 
                minPointSize={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-paid-${index}`} fill={entry.fill} />
                ))}
              </Bar>
              <Bar 
                dataKey="scheduled" 
                stackId="a" 
                radius={[4, 4, 4, 4]} 
                minPointSize={2}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-scheduled-${index}`} 
                    fill={entry.fill} 
                    fillOpacity={0.35} 
                  />
                ))}
                <LabelList
                  dataKey="amount"
                  content={(props: any) => (
                    <CustomBarLabel {...props} data={data} />
                  )}
                />
                 <LabelList
                  dataKey="amount"
                  position="insideRight"
                  content={(props: any) => {
                    const { x, width, y, height, index } = props
                    if (!data[index]) return null
                    const item = data[index]
                    
                    // Note: with stacking, 'x' and 'width' refer to the current segment.
                    // To show the label correctly for the TOTAL, we need the total width.
                    // However, Recharts doesn't easily give us the stacked 'total width' here.
                    // But wait, the YAxis and XAxis have the scale.
                    // A simpler way: attach the label to the LAST bar in the stack, 
                    // and use absolute positioning or calculate based on the total.
                    
                    const barCenterY = y + height / 2

                    // We use item.amount for the value logic
                    const totalWidth = props.viewBox.width // This might be the chart width
                    
                    // Actually, Recharts pass 'x' and 'width' relative to the segment.
                    // To get the total width of the stacked bar, we can sum them? 
                    // No, 'x' is the starting point of the segment.
                    // So totalWidth = (x - offset) + width.
                    
                    const chartX = props.offset?.x || 0
                    const totalBarWidth = (x - chartX) + width

                    // Only show inside if bar is wide enough
                    if (totalBarWidth < 90) return null

                    return (
                      <g>
                        <text
                          x={chartX + totalBarWidth - 8}
                          y={barCenterY - 7}
                          textAnchor="end"
                          dominantBaseline="central"
                          className="fill-white text-[10px] font-mono font-bold tabular-nums"
                          style={{ filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.3))" }}
                        >
                          {monetary.formatMonetaryValue(Math.abs(item.amount))}
                        </text>
                        <text
                          x={chartX + totalBarWidth - 8}
                          y={barCenterY + 7}
                          textAnchor="end"
                          dominantBaseline="central"
                          className="fill-white text-[10px] font-mono font-bold tabular-nums"
                          style={{ filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.3))" }}
                        >
                          {item.percentage.toFixed(2)}%
                        </text>
                      </g>
                    )
                  }}
                />
                
                {/* Fallback label for very small bars */}
                <LabelList
                  dataKey="amount"
                  position="right"
                  content={(props: any) => {
                    const { x, width, y, height, index } = props
                    if (!data[index]) return null
                    const item = data[index]
                    const barCenterY = y + height / 2

                    const chartX = props.offset?.x || 0
                    const totalBarWidth = (x - chartX) + width

                    if (totalBarWidth >= 90) return null

                    return (
                      <g>
                        <text
                          x={chartX + totalBarWidth + 6}
                          y={barCenterY - 7}
                          dominantBaseline="central"
                          className="fill-foreground text-[10px] font-mono font-medium tabular-nums"
                        >
                          {monetary.formatMonetaryValue(Math.abs(item.amount))}
                        </text>
                        <text
                          x={chartX + totalBarWidth + 6}
                          y={barCenterY + 7}
                          dominantBaseline="central"
                          className="fill-muted-foreground text-[10px] font-mono font-medium tabular-nums"
                        >
                          {item.percentage.toFixed(2)}%
                        </text>
                      </g>
                    )
                  }}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

type OpportunitiesStatsChartProps = {
  data: Array<{
    createdAt: string | null
    annualSavings: number
    weeklyHours: number
  }>
}

const chartConfig = {
  annualSavings: {
    label: "Annual Savings ($)",
    color: "#10b981", 
  },
  weeklyHours: {
    label: "Hours / Week",
    color: "#3b82f6", 
  },
} satisfies ChartConfig

type TimeRange = "week" | "month" | "halfYear"

const rangeLabel: Record<TimeRange, string> = {
  week: "За тиждень",
  month: "За місяць",
  halfYear: "За пів року",
}

function getStartDate(now: Date, range: TimeRange) {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  if (range === "week") start.setDate(start.getDate() - 7)
  if (range === "month") start.setMonth(start.getMonth() - 1)
  if (range === "halfYear") start.setMonth(start.getMonth() - 6)
  return start
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function getDayKey(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return getDateKey(d)
}

function getWeekKey(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diffToMonday)
  d.setHours(0, 0, 0, 0)
  return getDateKey(d)
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function getBucketKey(date: Date, range: TimeRange) {
  if (range === "week") return getDayKey(date)
  if (range === "month") return getWeekKey(date)
  return getMonthKey(date)
}

function buildBuckets(now: Date, range: TimeRange) {
  const buckets: Array<{ key: string; sortTs: number }> = []
  if (range === "week") {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - 6)
    for (let i = 0; i < 7; i++) {
      const current = new Date(start)
      current.setDate(start.getDate() + i)
      buckets.push({ key: getDayKey(current), sortTs: current.getTime() })
    }
    return buckets
  }

  if (range === "month") {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - 27)
    const seen = new Set<string>()
    for (let i = 0; i < 28; i++) {
      const current = new Date(start)
      current.setDate(start.getDate() + i)
      const key = getWeekKey(current)
      if (!seen.has(key)) {
        seen.add(key)
        buckets.push({ key, sortTs: new Date(key).getTime() })
      }
    }
    return buckets
  }

  for (let i = 5; i >= 0; i--) {
    const current = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({ key: getMonthKey(current), sortTs: current.getTime() })
  }
  return buckets
}

function formatLabel(key: string, range: TimeRange) {
  if (range === "week") {
    const d = new Date(key)
    return d.toLocaleDateString("uk-UA", { weekday: "short" })
  }

  if (range === "month") {
    const d = new Date(key)
    const monthDay = d.toLocaleDateString("uk-UA", { day: "numeric", month: "short" })
    return `тиж. від ${monthDay}`
  }

  const [year, month] = key.split("-")
  const d = new Date(Number(year), Number(month) - 1, 1)
  return d.toLocaleDateString("uk-UA", { month: "short" })
}

export function OpportunitiesStatsChart({ data }: OpportunitiesStatsChartProps) {
  const [range, setRange] = useState<TimeRange>("month")

  const chartData = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const startDate = getStartDate(now, range)
    const buckets = buildBuckets(now, range)
    const grouped = new Map<string, { annualSavings: number; weeklyHours: number }>()

    for (const item of data) {
      const date = item.createdAt ? new Date(item.createdAt) : null
      if (!date || Number.isNaN(date.getTime()) || date < startDate) continue

      const key = getBucketKey(date, range)

      const current = grouped.get(key)
      if (current) {
        current.annualSavings += item.annualSavings
        current.weeklyHours += item.weeklyHours
      } else {
        grouped.set(key, { annualSavings: item.annualSavings, weeklyHours: item.weeklyHours })
      }
    }

    return buckets.map(({ key }) => {
      const stats = grouped.get(key)
      return {
        label: formatLabel(key, range),
        annualSavings: Math.round(stats?.annualSavings ?? 0),
        weeklyHours: Math.round(stats?.weeklyHours ?? 0),
      }
    })
  }, [data, range])

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
      <CardHeader className="gap-4">
        <CardTitle>Opportunity Impact Timeline</CardTitle>
        <CardDescription>
          Тиждень показує колонки по днях, місяць - по тижнях, пів року - по місяцях.
        </CardDescription>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-border/60 p-1">
            {(Object.keys(rangeLabel) as TimeRange[]).map((key) => (
              <Button
                key={key}
                size="sm"
                variant={range === key ? "secondary" : "ghost"}
                onClick={() => setRange(key)}
              >
                {rangeLabel[key]}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Bar dataKey="annualSavings" fill="var(--color-annualSavings)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="weeklyHours" fill="var(--color-weeklyHours)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-border/60 text-sm text-muted-foreground">
            Немає даних за обраний період.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

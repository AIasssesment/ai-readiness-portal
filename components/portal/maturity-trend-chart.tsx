'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Dot,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AssessmentTrendPoint {
  date: string
  score: number
}

interface MaturityTrendChartProps {
  points: AssessmentTrendPoint[]
}

interface TooltipPayload {
  payload: AssessmentTrendPoint
}

interface TooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || !payload[0]) return null
  const point = payload[0].payload
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">Score: {point.score}%</p>
      <p className="text-muted-foreground">
        {new Date(point.date).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </p>
    </div>
  )
}

export function MaturityTrendChart({ points }: MaturityTrendChartProps) {
  if (points.length === 0) return null

  const chronological = [...points].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Show empty-state when only one data point exists
  if (chronological.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Maturity over time</CardTitle>
          <CardDescription>
            Take another assessment in 90 days to see your growth trajectory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-6">
            <div>
              <p className="text-3xl font-bold">{chronological[0].score}%</p>
              <p className="text-xs text-muted-foreground">
                Latest score • {new Date(chronological[0].date).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                Companies that re-assess every quarter
                <br /> improve <span className="font-semibold text-foreground">2.4× faster</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const latest = chronological[chronological.length - 1]
  const previous = chronological[chronological.length - 2]
  const delta = latest.score - previous.score
  const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus
  const trendColor =
    delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-600' : 'text-muted-foreground'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Maturity over time</CardTitle>
            <CardDescription>
              Your AI Maturity Score across {chronological.length} assessments
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{latest.score}%</p>
            <p className={cn('flex items-center justify-end gap-1 text-xs', trendColor)}>
              <TrendIcon className="h-3 w-3" />
              {delta > 0 ? '+' : ''}
              {delta} vs previous
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chronological} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) =>
                  new Date(d).toLocaleDateString(undefined, { month: 'short' })
                }
                tick={{ fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                tickLine={false}
                width={36}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={(props) => {
                  const { cx, cy, key } = props
                  return <Dot key={key} cx={cx} cy={cy} r={4} className="fill-primary" />
                }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

import { ShieldAlert } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface RiskOverviewProps {
  overallRiskScore: number
  executiveSummary: string | null
  generatedAt: string
}

function riskTier(score: number) {
  if (score >= 4) return { label: 'High disruption risk', color: 'text-red-600', bar: 'bg-red-500' }
  if (score >= 3) return { label: 'Medium-high risk', color: 'text-orange-600', bar: 'bg-orange-500' }
  if (score >= 2) return { label: 'Medium risk', color: 'text-amber-600', bar: 'bg-amber-500' }
  return { label: 'Low risk', color: 'text-emerald-600', bar: 'bg-emerald-500' }
}

export function RiskOverview({ overallRiskScore, executiveSummary, generatedAt }: RiskOverviewProps) {
  const tier = riskTier(overallRiskScore)
  const fillPct = (overallRiskScore / 5) * 100
  const generatedDateLabel = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
  }).format(new Date(generatedAt))

  return (
    <Card>
      <CardContent className="p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:items-center">
          {/* Gauge */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-40 w-40">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-muted"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(fillPct / 100) * 264} 264`}
                  className={cn(tier.color)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{overallRiskScore.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">out of 5</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldAlert className={cn('h-4 w-4', tier.color)} />
              <span className={cn('text-sm font-semibold', tier.color)}>{tier.label}</span>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Executive summary
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                {executiveSummary || 'No summary available.'}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Generated {generatedDateLabel} from your latest assessment data.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

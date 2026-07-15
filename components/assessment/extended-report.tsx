'use client'

import { useCallback, useState } from 'react'
import { 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  DollarSign, 
  Layers, 
  Calendar,
  BarChart3,
  Zap,
  Map,
  FileText,
  CheckCircle2,
  ArrowRight,
  Download,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAssessmentStore } from '@/lib/assessment-store'
import type { AssessmentResults, ExtendedReportData } from '@/lib/types'
import { cn } from '@/lib/utils'

export type ExtendedReportProps = {
  extendedReport?: ExtendedReportData | null
  results?: AssessmentResults | null
}

const severityColors = {
  low: 'border-transparent bg-emerald-500/20 text-emerald-300',
  medium: 'border-transparent bg-amber-500/25 text-amber-200',
  high: 'border-transparent bg-red-500/20 text-red-300',
}

const priorityBadgeColors = {
  essential: 'border-transparent bg-red-500/20 text-red-300',
  recommended: 'border-transparent bg-teal-500/20 text-teal-300',
  'nice-to-have': 'border-transparent bg-zinc-500/25 text-zinc-200',
}

const implementationColors = {
  'quick-win': 'border-transparent bg-emerald-500/20 text-emerald-300',
  'medium-term': 'border-transparent bg-sky-500/20 text-sky-300',
  'long-term': 'border-transparent bg-zinc-500/25 text-zinc-200',
}


function sanitizeFilenamePart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'company'
}

export function ExtendedReport({
  extendedReport: extendedProp,
  results: resultsProp,
}: ExtendedReportProps = {}) {
  const extendedReportFromStore = useAssessmentStore((state) => state.extendedReport)
  const resultsFromStore = useAssessmentStore((state) => state.results)
  const extendedReport = extendedProp ?? extendedReportFromStore
  const results = resultsProp ?? resultsFromStore

  const [exporting, setExporting] = useState(false)

  const handleDownloadPdf = useCallback(async () => {
    if (!results || !extendedReport || exporting) return

    setExporting(true)

    try {
      const company = sanitizeFilenamePart(results.companyInfo.companyName || 'report')
      const { exportExtendedReportToPdf } = await import('@/lib/export-report-pdf')
      await exportExtendedReportToPdf({
        report: extendedReport,
        results,
        filename: `ai-readiness-report-${company}`,
      })
      toast.success('PDF downloaded')
    } catch (error) {
      console.error('PDF export failed', error)
      toast.error('Could not generate PDF. Try again.')
    } finally {
      setExporting(false)
    }
  }, [exporting, extendedReport, results])

  if (!extendedReport || !results) return null

  const {
    readinessScore,
    riskIndex,
    automationOpportunities,
    costBenefit,
    techStack,
    actionPlan,
    benchmark,
    disruptionRisk,
    roadmap,
    executiveSummary,
  } = extendedReport

  return (
    <>
      {exporting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-[2px]">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-xl">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium text-foreground">Generating PDF…</span>
          </div>
        </div>
      ) : null}

    <div className="space-y-6 bg-background border border-border rounded-lg p-4">
      {/* Header */}
      <Card className="border-0 bg-transparent overflow-hidden">
        <div className="bg-accent px-6 py-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-accent-foreground" />
              <div>
                <h2 className="text-lg font-semibold text-accent-foreground">Extended Report Unlocked</h2>
                <p className="text-sm text-accent-foreground/80">
                  Complete automation blueprint for {results.companyInfo.companyName}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className={cn(
                'gap-2 bg-background/90 text-foreground hover:bg-background',
                exporting && 'pointer-events-none opacity-70',
              )}
              onClick={() => void handleDownloadPdf()}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {exporting ? 'Preparing PDF…' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Executive Summary */}
      <Card className="border-0 shadow-lg bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-primary/25 bg-primary/10 p-5">
            <p className="text-lg font-medium leading-relaxed text-foreground">
              {executiveSummary.headline}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Key Findings
              </h4>
              <ul className="space-y-2">
                {executiveSummary.keyFindings.map((finding, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-1.5 h-1.5 mt-2 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-foreground">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent" />
                Strategic Recommendations
              </h4>
              <ul className="space-y-2">
                {executiveSummary.strategicRecommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-1.5 h-1.5 mt-2 rounded-full bg-accent flex-shrink-0" />
                    <span className="text-foreground">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-4 pb-1">
            <h4 className="mb-3 font-semibold text-foreground">Next Steps</h4>
            <div className="flex flex-wrap gap-2">
              {executiveSummary.nextSteps.map((step, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="max-w-full whitespace-normal border-border bg-secondary/50 px-3 py-2 text-left text-sm text-foreground"
                >
                  {i + 1}. {step}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scores Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Readiness Score */}
        <Card className="border-0 shadow-lg bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Automation Readiness Score
            </CardTitle>
            <CardDescription>How prepared your organization is for automation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={`${readinessScore.score * 3.52} 352`}
                    className="text-primary"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-foreground">{readinessScore.score}%</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {Object.entries(readinessScore.breakdown).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-foreground">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-muted-foreground">{value}%</span>
                  </div>
                  <Progress value={value} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Index */}
        <Card className="border-0 shadow-lg bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Risk Index
            </CardTitle>
            <CardDescription>Areas requiring attention before automation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center mb-6">
              <div className="text-center">
                <span className="text-5xl font-bold text-destructive">{riskIndex.score}</span>
                <span className="text-2xl text-muted-foreground">/100</span>
                <p className="text-sm text-muted-foreground mt-1">Risk Level</p>
              </div>
            </div>
            <div className="space-y-3">
              {riskIndex.factors.map((factor, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-foreground">{factor.name}</span>
                    <Badge variant="secondary" className={cn('text-xs capitalize', severityColors[factor.severity])}>
                      {factor.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-foreground/70">{factor.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automation Opportunities */}
      <Card className="border-0 shadow-lg bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Top Automation Opportunities
          </CardTitle>
          <CardDescription>Prioritized by ROI and implementation complexity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Department</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Process</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Current Effort</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Potential</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Est. ROI</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Timeline</th>
                </tr>
              </thead>
              <tbody>
                {automationOpportunities.map((opp, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-3 px-4 text-sm text-foreground font-medium">{opp.department}</td>
                    <td className="py-3 px-4 text-sm text-foreground">{opp.process}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{opp.currentEffort}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Progress value={opp.automationPotential} className="h-2 w-16" />
                        <span className="text-sm text-foreground">{opp.automationPotential}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-accent">{opp.estimatedROI}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className={cn('text-xs capitalize', implementationColors[opp.implementation])}>
                        {opp.implementation.replace('-', ' ')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Cost-Benefit Analysis */}
      <Card className="border-0 shadow-lg bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-accent" />
            Cost-Benefit Analysis
          </CardTitle>
          <CardDescription>Financial impact of automation implementation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="text-center p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Current Annual Cost</p>
              <p className="text-2xl font-bold text-foreground">${costBenefit.currentAnnualCost.toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-accent/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Projected Savings</p>
              <p className="text-2xl font-bold text-accent">${costBenefit.projectedSavings.toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Implementation Cost</p>
              <p className="text-2xl font-bold text-foreground">${costBenefit.implementationCost.toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Payback Period</p>
              <p className="text-2xl font-bold text-primary">{costBenefit.paybackPeriod}</p>
            </div>
            <div className="text-center p-4 bg-accent/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">5-Year ROI</p>
              <p className="text-2xl font-bold text-accent">{costBenefit.fiveYearROI}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for remaining sections */}
      <Card className="border-0 shadow-lg bg-card">
        <Tabs defaultValue="techstack" className="w-full">
          <CardHeader>
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-secondary/60 p-1">
              <TabsTrigger value="techstack" className="gap-2 text-foreground/80 data-[state=active]:bg-background data-[state=active]:text-foreground">
                <Layers className="h-4 w-4" />
                Tech Stack
              </TabsTrigger>
              <TabsTrigger value="actionplan" className="gap-2 text-foreground/80 data-[state=active]:bg-background data-[state=active]:text-foreground">
                <Calendar className="h-4 w-4" />
                90-Day Plan
              </TabsTrigger>
              <TabsTrigger value="benchmark" className="gap-2 text-foreground/80 data-[state=active]:bg-background data-[state=active]:text-foreground">
                <BarChart3 className="h-4 w-4" />
                Benchmarks
              </TabsTrigger>
              <TabsTrigger value="disruption" className="gap-2 text-foreground/80 data-[state=active]:bg-background data-[state=active]:text-foreground">
                <AlertTriangle className="h-4 w-4" />
                AI Disruption
              </TabsTrigger>
              <TabsTrigger value="roadmap" className="gap-2 text-foreground/80 data-[state=active]:bg-background data-[state=active]:text-foreground">
                <Map className="h-4 w-4" />
                Roadmap
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            <TabsContent value="techstack" className="mt-0 space-y-3">
              {techStack.map((item, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-secondary/40 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                        {item.category}
                      </p>
                      <p className="font-semibold text-foreground">{item.tool}</p>
                      <p className="mt-1 text-sm text-foreground/75">{item.description}</p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn('shrink-0 capitalize', priorityBadgeColors[item.priority])}
                    >
                      {item.priority.replace(/-/g, ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="actionplan" className="mt-0 space-y-6">
              {actionPlan.map((phase, i) => (
                <div key={i} className="relative pl-8 pb-6 last:pb-0">
                  <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </div>
                  {i < actionPlan.length - 1 && (
                    <div className="absolute left-3 top-6 w-0.5 h-full -translate-x-1/2 bg-border" />
                  )}
                  <div className="bg-secondary/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground">{phase.phase}</h4>
                      <Badge variant="outline">{phase.timeframe}</Badge>
                    </div>
                    <ul className="space-y-2 mb-3">
                      {phase.actions.map((action, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm">
                          <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-foreground">{action}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-3 border-t border-border">
                      <p className="text-sm">
                        <span className="font-medium text-accent">Expected Outcome:</span>{' '}
                        <span className="text-muted-foreground">{phase.expectedOutcome}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="benchmark" className="mt-0 space-y-4">
              {benchmark.map((item, i) => (
                <div key={i} className="rounded-lg bg-secondary/40 p-4">
                  <p className="mb-3 font-medium text-foreground">{item.metric}</p>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <span className="w-28 shrink-0 text-sm text-foreground/80">Your Score</span>
                      <div className="relative h-3 flex-1 rounded-full bg-muted">
                        <div
                          className="absolute h-full rounded-full bg-primary"
                          style={{ width: `${item.yourScore}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-sm font-medium text-foreground">
                        {item.yourScore}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-28 shrink-0 text-sm text-foreground/80">Industry Avg</span>
                      <div className="relative h-3 flex-1 rounded-full bg-muted">
                        <div
                          className="absolute h-full rounded-full bg-zinc-400"
                          style={{ width: `${item.industryAverage}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-sm font-medium text-foreground/90">
                        {item.industryAverage}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-28 shrink-0 text-sm text-foreground/80">Top Performers</span>
                      <div className="relative h-3 flex-1 rounded-full bg-muted">
                        <div
                          className="absolute h-full rounded-full bg-accent"
                          style={{ width: `${item.topPerformers}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-sm font-medium text-accent">
                        {item.topPerformers}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="disruption" className="mt-0 space-y-4">
              <div className={cn(
                'rounded-lg border-2 p-4',
                disruptionRisk.overallRisk === 'high' && 'border-red-500/40 bg-red-500/10',
                disruptionRisk.overallRisk === 'medium' && 'border-amber-500/40 bg-amber-500/10',
                disruptionRisk.overallRisk === 'low' && 'border-emerald-500/40 bg-emerald-500/10',
              )}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="font-semibold text-foreground">Overall AI Disruption Risk</span>
                  <Badge
                    variant="secondary"
                    className={cn(severityColors[disruptionRisk.overallRisk], 'uppercase')}
                  >
                    {disruptionRisk.overallRisk}
                  </Badge>
                </div>
                <p className="text-sm text-foreground/75">{disruptionRisk.timelineEstimate}</p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Roles at Risk</h4>
                {disruptionRisk.affectedRoles.map((role, i) => (
                  <div key={i} className="rounded-lg bg-secondary/40 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="font-medium text-foreground">{role.role}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={role.riskLevel} className="h-2 w-20" />
                        <span
                          className={cn(
                            'w-10 text-right text-sm font-semibold tabular-nums',
                            role.riskLevel >= 70
                              ? 'text-red-300'
                              : role.riskLevel >= 50
                                ? 'text-amber-200'
                                : 'text-emerald-300',
                          )}
                        >
                          {role.riskLevel}%
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/75">
                      <span className="font-medium text-foreground">Recommendation:</span>{' '}
                      {role.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="roadmap" className="mt-0">
              <div className="grid gap-4 md:grid-cols-4">
                {roadmap.map((quarter, i) => (
                  <div key={i} className="bg-secondary/30 rounded-lg p-4">
                    <h4 className="font-semibold text-primary mb-3">{quarter.quarter}</h4>
                    <div className="space-y-3">
                      {quarter.initiatives.map((init, j) => (
                        <div key={j} className="p-3 bg-card rounded border border-border">
                          <div className="flex items-start justify-between mb-1">
                            <span className="font-medium text-sm text-foreground">{init.name}</span>
                            <Badge variant="outline" className="text-xs">P{init.priority}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{init.resources}</p>
                          {init.dependencies.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Depends on: {init.dependencies.join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
    </>
  )
}

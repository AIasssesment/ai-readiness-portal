'use client'

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
  Download
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAssessmentStore } from '@/lib/assessment-store'
import { cn } from '@/lib/utils'

const severityColors = {
  low: 'bg-accent/20 text-accent',
  medium: 'bg-warning/20 text-warning-foreground',
  high: 'bg-destructive/20 text-destructive',
}

const priorityColors = {
  essential: 'bg-destructive/20 text-destructive border-destructive/30',
  recommended: 'bg-primary/20 text-primary border-primary/30',
  'nice-to-have': 'bg-muted text-muted-foreground border-muted',
}

const implementationColors = {
  'quick-win': 'bg-accent text-accent-foreground',
  'medium-term': 'bg-primary text-primary-foreground',
  'long-term': 'bg-muted-foreground text-background',
}

export function ExtendedReport() {
  const extendedReport = useAssessmentStore((state) => state.extendedReport)
  const results = useAssessmentStore((state) => state.results)

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
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-xl bg-card overflow-hidden">
        <div className="bg-accent px-6 py-4">
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
            <Button variant="secondary" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
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
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-lg font-medium text-foreground leading-relaxed">
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

          <div className="border-t border-border pt-4">
            <h4 className="font-semibold text-foreground mb-3">Next Steps</h4>
            <div className="flex flex-wrap gap-2">
              {executiveSummary.nextSteps.map((step, i) => (
                <Badge key={i} variant="outline" className="text-sm py-1.5 px-3">
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
                    <Badge className={cn('text-xs', severityColors[factor.severity])}>
                      {factor.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{factor.description}</p>
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
                      <Badge className={cn('text-xs', implementationColors[opp.implementation])}>
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
            <TabsList className="w-full justify-start">
              <TabsTrigger value="techstack" className="gap-2">
                <Layers className="h-4 w-4" />
                Tech Stack
              </TabsTrigger>
              <TabsTrigger value="actionplan" className="gap-2">
                <Calendar className="h-4 w-4" />
                90-Day Plan
              </TabsTrigger>
              <TabsTrigger value="benchmark" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Benchmarks
              </TabsTrigger>
              <TabsTrigger value="disruption" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                AI Disruption
              </TabsTrigger>
              <TabsTrigger value="roadmap" className="gap-2">
                <Map className="h-4 w-4" />
                Roadmap
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            {/* Tech Stack */}
            <TabsContent value="techstack" className="mt-0 space-y-4">
              {techStack.map((item, i) => (
                <div key={i} className={cn(
                  'p-4 rounded-lg border',
                  priorityColors[item.priority]
                )}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.category}</p>
                      <p className="font-semibold text-foreground">{item.tool}</p>
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">{item.priority}</Badge>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* 90-Day Action Plan */}
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

            {/* Benchmarks */}
            <TabsContent value="benchmark" className="mt-0 space-y-4">
              {benchmark.map((item, i) => (
                <div key={i} className="p-4 bg-secondary/30 rounded-lg">
                  <p className="font-medium text-foreground mb-3">{item.metric}</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-28">Your Score</span>
                      <div className="flex-1 bg-muted rounded-full h-3 relative">
                        <div 
                          className="absolute h-full bg-primary rounded-full"
                          style={{ width: `${item.yourScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground w-12">{item.yourScore}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-28">Industry Avg</span>
                      <div className="flex-1 bg-muted rounded-full h-3 relative">
                        <div 
                          className="absolute h-full bg-muted-foreground/50 rounded-full"
                          style={{ width: `${item.industryAverage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12">{item.industryAverage}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-28">Top Performers</span>
                      <div className="flex-1 bg-muted rounded-full h-3 relative">
                        <div 
                          className="absolute h-full bg-accent rounded-full"
                          style={{ width: `${item.topPerformers}%` }}
                        />
                      </div>
                      <span className="text-sm text-accent w-12">{item.topPerformers}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* AI Disruption */}
            <TabsContent value="disruption" className="mt-0 space-y-4">
              <div className={cn(
                'p-4 rounded-lg border-2',
                disruptionRisk.overallRisk === 'high' && 'border-destructive/50 bg-destructive/5',
                disruptionRisk.overallRisk === 'medium' && 'border-warning/50 bg-warning/5',
                disruptionRisk.overallRisk === 'low' && 'border-accent/50 bg-accent/5'
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-foreground">Overall AI Disruption Risk</span>
                  <Badge className={cn(severityColors[disruptionRisk.overallRisk], 'uppercase')}>
                    {disruptionRisk.overallRisk}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{disruptionRisk.timelineEstimate}</p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Roles at Risk</h4>
                {disruptionRisk.affectedRoles.map((role, i) => (
                  <div key={i} className="p-4 bg-secondary/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">{role.role}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={role.riskLevel} className="h-2 w-20" />
                        <span className={cn(
                          'text-sm font-medium',
                          role.riskLevel >= 70 ? 'text-destructive' : role.riskLevel >= 50 ? 'text-warning-foreground' : 'text-accent'
                        )}>
                          {role.riskLevel}%
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Recommendation:</span> {role.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Roadmap */}
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
  )
}

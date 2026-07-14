import { createClient } from "@/lib/db-client/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { OpportunitiesStatsChart } from "@/components/portal/opportunities-stats-chart"
import { OpportunitiesGenerateButton } from "@/components/portal/opportunities-generate-button"
import { OpportunityAddForm } from "@/components/portal/opportunity-add-form"
import {
  formatAssumptionsCaption,
  formatCompactUsd,
  type OpportunityDetails,
  type SavingsAssumptions,
} from "@/lib/opportunities/savings"
import {
  Lightbulb,
  TrendingUp,
  Clock,
  Building2,
  Gauge,
  DollarSign,
} from "lucide-react"
import Link from "next/link"
import { t } from "@/lib/i18n"
import { getServerLocale } from "@/lib/i18n-server"

type ClientRow = {
  id: string
  user_id: string
}

type OpportunityRow = {
  id: string
  created_at: string | null
  title: string
  description: string | null
  priority: string
  complexity: string
  department: string | null
  status: string
  implementation_timeline: string | null
  estimated_annual_savings: string | number | null
  estimated_hours_saved_weekly: number | string | null
  notes: string | null
  source?: string | null
  why_relevant?: string | null
  relevance_score?: number | null
  confidence_score?: number | null
  savings_assumptions?: SavingsAssumptions | Record<string, unknown> | null
  business_problem?: string | null
  proposed_solution?: string | null
  pain_points?: unknown
  decision_makers?: unknown
  details?: OpportunityDetails | null
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "high": return "border-red-500/30 bg-red-500/15 text-red-200"
    case "medium": return "border-amber-500/30 bg-amber-500/15 text-amber-200"
    case "low": return "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
    default: return "border-slate-500/30 bg-slate-500/15 text-slate-200"
  }
}

function getComplexityColor(complexity: string) {
  switch (complexity) {
    case "high": return "border-purple-500/30 bg-purple-500/15 text-purple-200"
    case "medium": return "border-blue-500/30 bg-blue-500/15 text-blue-200"
    case "low": return "border-green-500/30 bg-green-500/15 text-green-200"
    default: return "border-slate-500/30 bg-slate-500/15 text-slate-200"
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "completed": return "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
    case "in_progress": return "border-blue-500/30 bg-blue-500/15 text-blue-200"
    case "approved": return "border-purple-500/30 bg-purple-500/15 text-purple-200"
    case "in_review": return "border-amber-500/30 bg-amber-500/15 text-amber-200"
    case "rejected": return "border-red-500/30 bg-red-500/15 text-red-200"
    default: return "border-slate-500/30 bg-slate-500/15 text-slate-200"
  }
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item || "").trim()).filter(Boolean)
}

function parseDetails(value: unknown): OpportunityDetails {
  if (!value || typeof value !== "object") return {}
  const row = value as OpportunityDetails
  return {
    expected_roi: row.expected_roi,
    savings_confidence: row.savings_confidence,
    capabilities: asStringList(row.capabilities),
    integrations: asStringList(row.integrations),
    evidence: asStringList(row.evidence),
  }
}

export default async function OpportunitiesPage() {
  const locale = await getServerLocale()
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()

  const { data: client } = await db
    .from("clients")
    .select()
    .eq("user_id", user?.id)
    .single()
  const typedClient = (client ?? null) as unknown as ClientRow | null

  const { data: rawOpportunities } = await db
    .from("opportunities")
    .select()
    .eq("client_id", typedClient?.id)
    .order("priority", { ascending: true })
    .order("estimated_annual_savings", { ascending: false })
  const opportunities = (rawOpportunities ?? []) as OpportunityRow[]

  const totalSavings =
    opportunities.reduce(
      (sum: number, o: OpportunityRow) => sum + (parseFloat(String(o.estimated_annual_savings ?? 0)) || 0),
      0,
    ) || 0
  const totalHours =
    opportunities.reduce(
      (sum: number, o: OpportunityRow) => sum + (parseFloat(String(o.estimated_hours_saved_weekly ?? 0)) || 0),
      0,
    ) || 0
  const formattedTotalHours = Number(totalHours.toFixed(1)).toLocaleString()
  const formattedYearlyHours = Math.round(totalHours * 52).toLocaleString()
  const highPriority = opportunities.filter((o: OpportunityRow) => o.priority === "high").length || 0
  const averageSavings = opportunities?.length ? Math.round(totalSavings / opportunities.length) : 0

  const opportunitiesForTimeline = opportunities.map((opportunity: OpportunityRow) => ({
    createdAt: opportunity.created_at,
    annualSavings: parseFloat(String(opportunity.estimated_annual_savings ?? 0)) || 0,
    weeklyHours: parseFloat(String(opportunity.estimated_hours_saved_weekly ?? 0)) || 0,
  }))

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            {t(locale, "opps.title")}
          </h1>
          <p className="text-muted-foreground">
            {t(locale, "opps.subtitle")}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <OpportunitiesGenerateButton />
        <OpportunityAddForm />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 bg-card/70 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t(locale, "opps.totalOpportunities")}
            </CardTitle>
            <Lightbulb className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{opportunities?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {highPriority} {t(locale, "dashboard.highPriority")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t(locale, "opps.estAnnualSavings")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCompactUsd(totalSavings)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t(locale, "opps.combinedPotential")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t(locale, "dashboard.hoursSavedWeek")}
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold tabular-nums break-words leading-tight">
              {formattedTotalHours}
            </div>
            <p className="text-xs text-muted-foreground">
              {formattedYearlyHours} {t(locale, "opps.hoursPerYear")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t(locale, "opps.avgOpportunityValue")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCompactUsd(averageSavings)}</div>
            <p className="text-xs text-muted-foreground">
              {t(locale, "opps.avgSavingsPerInitiative")}
            </p>
          </CardContent>
        </Card>
      </div>

      {opportunities.length > 0 && <OpportunitiesStatsChart data={opportunitiesForTimeline} />}

      {opportunities.length > 0 ? (
        <div className="space-y-4">
          {opportunities.map((opportunity) => {
            const annual = parseFloat(String(opportunity.estimated_annual_savings ?? 0)) || 0
            const assumptions = opportunity.savings_assumptions as SavingsAssumptions | undefined
            const assumptionsCaption = formatAssumptionsCaption(assumptions)
            const details = parseDetails(opportunity.details)
            const decisionMakers = asStringList(opportunity.decision_makers)
            const painPoints = asStringList(opportunity.pain_points)
            const hasDetails =
              Boolean(details.expected_roi) ||
              Boolean(details.savings_confidence) ||
              (details.capabilities?.length ?? 0) > 0 ||
              (details.integrations?.length ?? 0) > 0 ||
              (details.evidence?.length ?? 0) > 0 ||
              decisionMakers.length > 0 ||
              painPoints.length > 0

            return (
              <Card
                key={opportunity.id}
                className="group overflow-hidden border-border/70 bg-gradient-to-b from-slate-950/95 to-slate-900/90 shadow-[0_0_0_1px_rgba(148,163,184,0.15)] backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-[0_0_0_1px_rgba(45,212,191,0.35)]"
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 h-3 w-3 rounded-full shrink-0 ${
                          opportunity.priority === "high" ? "bg-red-500" :
                          opportunity.priority === "medium" ? "bg-amber-500" : "bg-emerald-500"
                        }`} />
                        <div className="flex-1">
                          <h3 className="text-2xl font-semibold tracking-tight text-slate-100 transition-colors group-hover:text-white">
                            {opportunity.title}
                          </h3>
                          {opportunity.description && (
                            <p className="mt-1 text-base text-slate-300/90">{opportunity.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={`font-medium ${getPriorityColor(opportunity.priority)}`}>
                          {opportunity.priority} {t(locale, "opps.priority")}
                        </Badge>
                        <Badge variant="outline" className={`font-medium ${getComplexityColor(opportunity.complexity)}`}>
                          <Gauge className="h-3 w-3 mr-1" />
                          {opportunity.complexity} {t(locale, "opps.complexity")}
                        </Badge>
                        {opportunity.department && (
                          <Badge variant="outline" className="border-slate-400/30 bg-slate-700/30 text-slate-200">
                            <Building2 className="h-3 w-3 mr-1" />
                            {opportunity.department}
                          </Badge>
                        )}
                        <Badge variant="outline" className={`font-medium ${getStatusColor(opportunity.status)}`}>
                          {opportunity.status.replace(/_/g, " ")}
                        </Badge>
                        {opportunity.source && (
                          <Badge variant="outline" className="border-slate-400/30 bg-slate-700/20 text-slate-300">
                            {opportunity.source}
                          </Badge>
                        )}
                      </div>

                      {opportunity.implementation_timeline && (
                        <p className="text-sm text-slate-300/80">
                          <Clock className="mr-1 inline h-3.5 w-3.5" />
                          {t(locale, "opps.timelinePrefix")} {opportunity.implementation_timeline}
                        </p>
                      )}

                      {opportunity.why_relevant && (
                        <p className="text-sm text-slate-300/90">
                          <strong>{t(locale, "opps.whyRelevant")}</strong> {opportunity.why_relevant}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-4 border-t border-slate-700/70 pt-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <div className="text-5xl font-bold tracking-tight text-emerald-400">
                          {formatCompactUsd(annual)}
                        </div>
                        <div className="text-xl text-slate-300/80">{t(locale, "opps.estAnnualSavings")}</div>
                        {assumptionsCaption && (
                          <p className="text-xs text-slate-400/90">{t(locale, "opps.assumptions")}: {assumptionsCaption}</p>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-5xl font-bold tracking-tight text-slate-100">
                          {(parseFloat(String(opportunity.estimated_hours_saved_weekly ?? 0)) || 0).toLocaleString()} {t(locale, "opps.hrsWeek")}
                        </div>
                        <div className="text-xl text-slate-300/80">{t(locale, "opps.timeSavings")}</div>
                      </div>
                    </div>
                  </div>

                  {hasDetails && (
                    <div className="mt-4 space-y-3 rounded-lg border border-slate-600/50 bg-slate-800/40 p-4">
                      {details.expected_roi && (
                        <p className="text-sm text-slate-300/90">
                          <strong>{t(locale, "opps.expectedRoi")}</strong> {details.expected_roi}
                          {details.savings_confidence ? ` · ${t(locale, "opps.savingsConfidence")}: ${details.savings_confidence}` : ""}
                        </p>
                      )}
                      {!details.expected_roi && details.savings_confidence && (
                        <p className="text-sm text-slate-300/90">
                          <strong>{t(locale, "opps.savingsConfidence")}:</strong> {details.savings_confidence}
                        </p>
                      )}
                      {decisionMakers.length > 0 && (
                        <div>
                          <p className="mb-1.5 text-sm font-medium text-slate-200">{t(locale, "opps.decisionMakers")}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {decisionMakers.map((item) => (
                              <Badge key={item} variant="outline" className="border-slate-500/40 bg-slate-900/40 text-slate-200">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {painPoints.length > 0 && (
                        <div>
                          <p className="mb-1.5 text-sm font-medium text-slate-200">{t(locale, "opps.painPoints")}</p>
                          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300/90">
                            {painPoints.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(details.capabilities?.length ?? 0) > 0 && (
                        <div>
                          <p className="mb-1.5 text-sm font-medium text-slate-200">{t(locale, "opps.capabilities")}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {details.capabilities!.map((item) => (
                              <Badge key={item} variant="outline" className="border-teal-500/30 bg-teal-950/30 text-teal-100">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {(details.integrations?.length ?? 0) > 0 && (
                        <div>
                          <p className="mb-1.5 text-sm font-medium text-slate-200">{t(locale, "opps.integrations")}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {details.integrations!.map((item) => (
                              <Badge key={item} variant="outline" className="border-indigo-500/30 bg-indigo-950/30 text-indigo-100">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {(details.evidence?.length ?? 0) > 0 && (
                        <div>
                          <p className="mb-1.5 text-sm font-medium text-slate-200">{t(locale, "opps.evidence")}</p>
                          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300/90">
                            {details.evidence!.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {opportunity.notes && (
                    <div className="mt-4 rounded-lg border border-slate-600/50 bg-slate-800/40 p-3">
                      <p className="text-sm text-slate-300/90">
                        <strong>{t(locale, "opps.notes")}</strong> {opportunity.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Lightbulb className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t(locale, "opps.emptyTitle")}</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {t(locale, "opps.emptyDescription")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/portal/assessments/new">
                <Button size="lg" variant="outline">{t(locale, "opps.takeAssessment")}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

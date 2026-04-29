import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { OpportunitiesStatsChart } from "@/components/portal/opportunities-stats-chart"
import { 
  Lightbulb, 
  TrendingUp, 
  Clock, 
  Building2,
  Gauge,
  DollarSign,
} from "lucide-react"
import Link from "next/link"

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
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "high": return "bg-red-100 text-red-700 border-red-200"
    case "medium": return "bg-amber-100 text-amber-700 border-amber-200"
    case "low": return "bg-emerald-100 text-emerald-700 border-emerald-200"
    default: return "bg-slate-100 text-slate-700 border-slate-200"
  }
}

function getComplexityColor(complexity: string) {
  switch (complexity) {
    case "high": return "bg-purple-100 text-purple-700"
    case "medium": return "bg-blue-100 text-blue-700"
    case "low": return "bg-green-100 text-green-700"
    default: return "bg-slate-100 text-slate-700"
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "completed": return "bg-emerald-100 text-emerald-700"
    case "in_progress": return "bg-blue-100 text-blue-700"
    case "approved": return "bg-purple-100 text-purple-700"
    case "in_review": return "bg-amber-100 text-amber-700"
    case "rejected": return "bg-red-100 text-red-700"
    default: return "bg-slate-100 text-slate-700"
  }
}

export default async function OpportunitiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get client
  const { data: client } = await supabase
    .from("clients")
    .select()
    .eq("user_id", user?.id)
    .single()
  const typedClient = (client ?? null) as unknown as ClientRow | null

  // Get all opportunities
  const { data: rawOpportunities } = await supabase
    .from("opportunities")
    .select()
    .eq("client_id", typedClient?.id)
    .order("priority", { ascending: true })
    .order("estimated_annual_savings", { ascending: false })
  const opportunities = (rawOpportunities ?? []) as OpportunityRow[]

  // Calculate totals
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
            AI Opportunities
          </h1>
          <p className="text-muted-foreground">
            Identified opportunities for AI implementation in your organization
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 bg-card/70 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Opportunities
            </CardTitle>
            <Lightbulb className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{opportunities?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {highPriority} high priority
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Est. Annual Savings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              ${totalSavings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Combined potential
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hours Saved/Week
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold tabular-nums break-words leading-tight">
              {formattedTotalHours}
            </div>
            <p className="text-xs text-muted-foreground">
              {formattedYearlyHours} hours/year
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Opportunity Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageSavings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              average savings per initiative
            </p>
          </CardContent>
        </Card>
      </div>

      <OpportunitiesStatsChart data={opportunitiesForTimeline} />

      {/* Opportunities List */}
      {opportunities.length > 0 ? (
        <div className="space-y-4">
          {opportunities.map((opportunity) => (
            <Card
              key={opportunity.id}
              className="group border-border/60 bg-card/75 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 h-3 w-3 rounded-full shrink-0 ${
                        opportunity.priority === "high" ? "bg-red-500" :
                        opportunity.priority === "medium" ? "bg-amber-500" : "bg-emerald-500"
                      }`} />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold tracking-tight transition-colors group-hover:text-primary">
                          {opportunity.title}
                        </h3>
                        {opportunity.description && (
                          <p className="mt-1 text-muted-foreground">{opportunity.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className={getPriorityColor(opportunity.priority)}>
                        {opportunity.priority} priority
                      </Badge>
                      <Badge variant="secondary" className={getComplexityColor(opportunity.complexity)}>
                        <Gauge className="h-3 w-3 mr-1" />
                        {opportunity.complexity} complexity
                      </Badge>
                      {opportunity.department && (
                        <Badge variant="secondary">
                          <Building2 className="h-3 w-3 mr-1" />
                          {opportunity.department}
                        </Badge>
                      )}
                      <Badge variant="secondary" className={getStatusColor(opportunity.status)}>
                        {opportunity.status.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    {opportunity.implementation_timeline && (
                      <p className="text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 inline mr-1" />
                        Timeline: {opportunity.implementation_timeline}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 rounded-xl border border-border/60 bg-muted/30 p-3 lg:min-w-48 lg:text-right">
                    <div className="space-y-0.5">
                      <div className="text-2xl font-bold text-emerald-600">
                        ${parseFloat(String(opportunity.estimated_annual_savings ?? 0)).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Est. Annual Savings</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-lg font-semibold">
                        {(parseFloat(String(opportunity.estimated_hours_saved_weekly ?? 0)) || 0).toLocaleString()} hrs/week
                      </div>
                      <div className="text-xs text-muted-foreground">Time Savings</div>
                    </div>
                  </div>
                </div>

                {opportunity.notes && (
                  <div className="mt-4 rounded-lg border border-border/60 bg-muted/20 p-3">
                    <p className="text-sm text-muted-foreground">
                      <strong>Notes:</strong> {opportunity.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Lightbulb className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Opportunities Yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Complete an AI readiness assessment to identify potential opportunities 
              for AI implementation in your organization.
            </p>
            <Link href="/">
              <Button size="lg">Take Assessment</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

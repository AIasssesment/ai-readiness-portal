import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
  FileText, 
  Lightbulb, 
  TrendingUp, 
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Zap
} from "lucide-react"

function getReadinessColor(level: string) {
  switch (level) {
    case "leader": return "bg-emerald-500"
    case "advanced": return "bg-blue-500"
    case "developing": return "bg-amber-500"
    case "emerging": return "bg-orange-500"
    default: return "bg-slate-500"
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Completed</Badge>
    case "in_progress":
      return <Badge variant="secondary" className="bg-blue-100 text-blue-700">In Progress</Badge>
    case "reviewed":
      return <Badge variant="secondary" className="bg-purple-100 text-purple-700">Reviewed</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default async function PortalDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get client
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user?.id)
    .single()

  // Get assessments
  const { data: assessments } = await supabase
    .from("assessments")
    .select("*")
    .eq("client_id", client?.id)
    .order("created_at", { ascending: false })
    .limit(5)

  // Get opportunities
  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("*")
    .eq("client_id", client?.id)
    .order("priority", { ascending: true })

  // Get latest assessment
  const latestAssessment = assessments?.[0]

  // Calculate stats
  const totalOpportunities = opportunities?.length || 0
  const highPriorityOpportunities = opportunities?.filter(o => o.priority === "high").length || 0
  const totalEstimatedSavings = opportunities?.reduce((sum, o) => sum + (parseFloat(o.estimated_annual_savings) || 0), 0) || 0
  const totalHoursSaved = opportunities?.reduce((sum, o) => sum + (o.estimated_hours_saved_weekly || 0), 0) || 0

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {client?.contact_name || client?.company_name}
          </h1>
          <p className="text-muted-foreground">
            {"Here's an overview of your AI readiness journey"}
          </p>
        </div>
        <Link href="/">
          <Button className="gap-2">
            <Zap className="h-4 w-4" />
            New Assessment
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assessments
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {latestAssessment ? `Latest: ${new Date(latestAssessment.created_at).toLocaleDateString()}` : "No assessments yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Opportunities
            </CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOpportunities}</div>
            <p className="text-xs text-muted-foreground">
              {highPriorityOpportunities} high priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Est. Annual Savings
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalEstimatedSavings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all opportunities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hours Saved/Week
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHoursSaved}</div>
            <p className="text-xs text-muted-foreground">
              Potential time savings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Latest Assessment Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Latest Assessment</CardTitle>
              {latestAssessment && getStatusBadge(latestAssessment.status)}
            </div>
            <CardDescription>
              Your most recent AI readiness evaluation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {latestAssessment ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Score</span>
                      <span className="text-2xl font-bold">{latestAssessment.overall_score}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full", getReadinessColor(latestAssessment.readiness_level))}
                        style={{ width: `${latestAssessment.overall_score}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Readiness Level</span>
                  <Badge variant="outline" className="capitalize">
                    {latestAssessment.readiness_level}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completed</span>
                  <span>{new Date(latestAssessment.created_at).toLocaleDateString()}</span>
                </div>
                <Link href={`/portal/assessments/${latestAssessment.id}`}>
                  <Button variant="outline" className="w-full mt-2 gap-2">
                    View Full Report
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No assessments yet</p>
                <Link href="/">
                  <Button>Take Your First Assessment</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Opportunities Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Top Opportunities</CardTitle>
              <Link href="/portal/opportunities">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <CardDescription>
              High-impact AI opportunities identified for your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {opportunities && opportunities.length > 0 ? (
              <div className="space-y-4">
                {opportunities.slice(0, 4).map((opportunity) => (
                  <div 
                    key={opportunity.id} 
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className={cn(
                      "mt-0.5 h-2 w-2 rounded-full shrink-0",
                      opportunity.priority === "high" ? "bg-red-500" :
                      opportunity.priority === "medium" ? "bg-amber-500" : "bg-emerald-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{opportunity.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {opportunity.department} • {opportunity.complexity} complexity
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-emerald-600">
                        ${parseFloat(opportunity.estimated_annual_savings || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">/year</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No opportunities identified yet</p>
                <p className="text-sm text-muted-foreground">
                  Complete an assessment to discover AI opportunities
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and next steps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/" className="block">
              <div className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">New Assessment</p>
                  <p className="text-xs text-muted-foreground">Start fresh evaluation</p>
                </div>
              </div>
            </Link>
            <Link href="/portal/assessments" className="block">
              <div className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">View Reports</p>
                  <p className="text-xs text-muted-foreground">Access all assessments</p>
                </div>
              </div>
            </Link>
            <Link href="/portal/opportunities" className="block">
              <div className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">Explore Opportunities</p>
                  <p className="text-xs text-muted-foreground">Review AI use cases</p>
                </div>
              </div>
            </Link>
            <Link href="/portal/settings" className="block">
              <div className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-slate-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">Update Profile</p>
                  <p className="text-xs text-muted-foreground">Manage company info</p>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ")
}

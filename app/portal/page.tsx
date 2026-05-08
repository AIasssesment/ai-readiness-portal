import { createClient } from "@/lib/db-client/server"
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
import { UnlockReportButton } from "@/components/portal/unlock-report-button"
import { t } from "@/lib/i18n"
import { getServerLocale } from "@/lib/i18n-server"
import { cookies } from "next/headers"

type Client = {
  id: string
  company_name: string
  contact_name: string | null
  has_extended_access?: boolean
}

type Assessment = {
  id: string
  overall_score: number
  readiness_level: string
  created_at: string
  status: string
}

type ReportRequestRow = {
  assessment_id: string | null
  status: string
}

const PAID_REPORT_STATUSES = new Set(["paid", "pending_manual", "ready"])

type Opportunity = {
  id: string
  title: string
  department: string | null
  complexity: string
  priority: string
  estimated_annual_savings: number | string
  estimated_hours_saved_weekly: number | string | null
}

function getReadinessColor(level: string) {
  switch (level) {
    case "leader": return "bg-emerald-500"
    case "advanced": return "bg-blue-500"
    case "developing": return "bg-amber-500"
    case "emerging": return "bg-orange-500"
    default: return "bg-slate-500"
  }
}

function getStatusBadge(status: string, locale: "en" | "uk") {
  switch (status) {
    case "completed":
      return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">{t(locale, "status.completed")}</Badge>
    case "in_progress":
      return <Badge variant="secondary" className="bg-blue-100 text-blue-700">{t(locale, "status.inProgress")}</Badge>
    case "reviewed":
      return <Badge variant="secondary" className="bg-purple-100 text-purple-700">{t(locale, "status.reviewed")}</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default async function PortalDashboard() {
  const locale = await getServerLocale()
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()

  // Get client
  const { data: client } = await db
    .from("clients")
    .select()
    .eq("user_id", user?.id)
    .single()

  // Get assessments
  const { data: assessments } = await db
    .from("assessments")
    .select()
    .eq("client_id", (client as any)?.id)
    .order("created_at", { ascending: false })
    .limit(5)

  // Get opportunities
  const { data: opportunities } = await db
    .from("opportunities")
    .select()
    .eq("client_id", (client as any)?.id)
    .order("priority", { ascending: true })

  // Get latest assessment
  const typedClient = client as unknown as Client | null
  const typedAssessments = (assessments as unknown as Assessment[]) || []
  const typedOpportunities = (opportunities as unknown as Opportunity[]) || []
  const latestAssessment = typedAssessments[0]
  const reportRequestsQuery = (db as unknown as {
    from: (table: string) => {
      select: () => { eq: (column: string, value: string | undefined) => Promise<{ data: unknown }> }
    }
  })

  const { data: reportRequests } = await reportRequestsQuery
    .from("report_requests")
    .select()
    .eq("client_id", (client as { id?: string } | null)?.id)

  const unlockedAssessmentIds = new Set(
    ((reportRequests as unknown as ReportRequestRow[] | null) ?? [])
      .filter((row) => PAID_REPORT_STATUSES.has(row.status))
      .map((row) => row.assessment_id)
      .filter((id): id is string => Boolean(id)),
  )

  const latestAssessmentUnlocked = latestAssessment
    ? unlockedAssessmentIds.has(latestAssessment.id)
    : false

  const testModeEnabled = process.env.NEXT_PUBLIC_PAYMENT_TEST_MODE === "true"
  let latestAssessmentUnlockedInTest = false
  if (testModeEnabled && latestAssessment) {
    const cookieStore = await cookies()
    const fromCookie = cookieStore.get("test_paid_assessment_ids")?.value ?? ""
    latestAssessmentUnlockedInTest = fromCookie
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .includes(latestAssessment.id)
  }

  // Calculate stats
  const totalOpportunities = typedOpportunities.length
  const highPriorityOpportunities = typedOpportunities.filter((o) => o.priority === "high").length
  const totalEstimatedSavings = typedOpportunities.reduce((sum: number, o) => sum + (parseFloat(String(o.estimated_annual_savings)) || 0), 0)
  const totalHoursSaved = typedOpportunities.reduce(
    (sum: number, o) => sum + (parseFloat(String(o.estimated_hours_saved_weekly ?? 0)) || 0),
    0,
  )
  const formattedTotalHoursSaved = Number(totalHoursSaved.toFixed(1)).toLocaleString()

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t(locale, "dashboard.welcomeBack" )} {typedClient?.contact_name || typedClient?.company_name}
          </h1>
          <p className="text-muted-foreground">
            {t(locale, "dashboard.overviewSubtitle")}
          </p>
        </div>
        <Link href="/">
          <Button className="gap-2">
            <Zap className="h-4 w-4" />
            {t(locale, "dashboard.newAssessment")}
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t(locale, "dashboard.assessments")}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{typedAssessments.length}</div>
            <p className="text-xs text-muted-foreground">
              {latestAssessment
                ? `${t(locale, "dashboard.latestPrefix")} ${new Date(latestAssessment.created_at).toLocaleDateString()}`
                : t(locale, "dashboard.noAssessmentsYet")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t(locale, "dashboard.opportunities")}
            </CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOpportunities}</div>
            <p className="text-xs text-muted-foreground">
              {highPriorityOpportunities} {t(locale, "dashboard.highPriority")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t(locale, "dashboard.estAnnualSavings")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalEstimatedSavings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {t(locale, "dashboard.acrossAllOpportunities")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t(locale, "dashboard.hoursSavedWeek")}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums break-all leading-tight">
              {formattedTotalHoursSaved}
            </div>
            <p className="text-xs text-muted-foreground">
              {t(locale, "dashboard.potentialTimeSavings")}
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
              <CardTitle>{t(locale, "dashboard.latestAssessment")}</CardTitle>
              {latestAssessment && getStatusBadge(latestAssessment.status, locale)}
            </div>
            <CardDescription>
              {t(locale, "dashboard.latestAssessmentDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {latestAssessment ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{t(locale, "dashboard.overallScore")}</span>
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
                  <span className="text-muted-foreground">{t(locale, "dashboard.readinessLevel")}</span>
                  <Badge variant="outline" className="capitalize">
                    {latestAssessment.readiness_level}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t(locale, "status.completed")}</span>
                  <span>{new Date(latestAssessment.created_at).toLocaleDateString()}</span>
                </div>
                {latestAssessmentUnlocked || latestAssessmentUnlockedInTest ? (
                  <Link href={`/portal/assessments/${latestAssessment.id}`}>
                    <Button variant="outline" className="w-full mt-2 gap-2">
                      {t(locale, "dashboard.viewFullReport")}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <UnlockReportButton
                    className="w-full mt-2 gap-2"
                    clientId={typedClient?.id}
                    assessmentId={latestAssessment.id}
                    mode="charge_and_manual"
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">{t(locale, "dashboard.noAssessmentsYet")}</p>
                <Link href="/">
                  <Button>{t(locale, "dashboard.takeFirstAssessment")}</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Opportunities Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t(locale, "dashboard.topOpportunities")}</CardTitle>
              <Link href="/portal/opportunities">
                <Button variant="ghost" size="sm" className="gap-1">
                  {t(locale, "dashboard.viewAll")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <CardDescription>
              {t(locale, "dashboard.topOpportunitiesDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {typedOpportunities.length > 0 ? (
              <div className="space-y-4">
                {typedOpportunities.slice(0, 4).map((opportunity) => (
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
                        {opportunity.department} • {opportunity.complexity} {t(locale, "dashboard.complexity")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-emerald-600">
                        ${parseFloat(String(opportunity.estimated_annual_savings || 0)).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{t(locale, "dashboard.perYear")}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">{t(locale, "dashboard.noOpportunitiesYet")}</p>
                <p className="text-sm text-muted-foreground">
                  {t(locale, "dashboard.completeAssessmentForOpps")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "dashboard.quickActions")}</CardTitle>
          <CardDescription>{t(locale, "dashboard.quickActionsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/" className="block">
              <div className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{t(locale, "dashboard.newAssessment")}</p>
                  <p className="text-xs text-muted-foreground">{t(locale, "dashboard.startFreshEvaluation")}</p>
                </div>
              </div>
            </Link>
            <Link href="/portal/assessments" className="block">
              <div className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">{t(locale, "dashboard.viewReports")}</p>
                  <p className="text-xs text-muted-foreground">{t(locale, "dashboard.accessAllAssessments")}</p>
                </div>
              </div>
            </Link>
            <Link href="/portal/opportunities" className="block">
              <div className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">{t(locale, "dashboard.exploreOpportunities")}</p>
                  <p className="text-xs text-muted-foreground">{t(locale, "dashboard.reviewAiUseCases")}</p>
                </div>
              </div>
            </Link>
            <Link href="/portal/settings" className="block">
              <div className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-slate-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">{t(locale, "dashboard.updateProfile")}</p>
                  <p className="text-xs text-muted-foreground">{t(locale, "dashboard.manageCompanyInfo")}</p>
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

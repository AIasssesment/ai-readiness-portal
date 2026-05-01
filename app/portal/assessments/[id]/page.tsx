import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
  ArrowLeft, 
  Download, 
  Calendar, 
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Target
} from "lucide-react"
import { UnlockReportButton } from "@/components/portal/unlock-report-button"
import { t } from "@/lib/i18n"
import { getServerLocale } from "@/lib/i18n-server"

type Client = {
  id: string
  has_extended_access?: boolean
}

type Assessment = {
  id: string
  overall_score: number
  readiness_level: string
  dimension_scores: Record<string, number> | null
  created_at: string
}

type Opportunity = {
  id: string
  title: string
  description: string | null
  priority: string
  department: string | null
  estimated_annual_savings: number | string
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

function getReadinessLabel(level: string, locale: "en" | "uk") {
  switch (level) {
    case "leader": return t(locale, "assessments.readiness.leader")
    case "advanced": return t(locale, "assessments.readiness.advanced")
    case "developing": return t(locale, "assessments.readiness.developing")
    case "emerging": return t(locale, "assessments.readiness.emerging")
    default: return level
  }
}

function getReadinessDescription(level: string, locale: "en" | "uk") {
  switch (level) {
    case "leader":
      return t(locale, "assessmentDetail.readinessDescription.leader")
    case "advanced":
      return t(locale, "assessmentDetail.readinessDescription.advanced")
    case "developing":
      return t(locale, "assessmentDetail.readinessDescription.developing")
    case "emerging":
      return t(locale, "assessmentDetail.readinessDescription.emerging")
    default:
      return t(locale, "assessmentDetail.readinessDescription.default")
  }
}

const dimensionLabels: Record<string, string> = {
  data_infrastructure: "Data Infrastructure",
  technical_readiness: "Technical Readiness",
  organizational_culture: "Organizational Culture",
  strategic_alignment: "Strategic Alignment",
  skills_talent: "Skills & Talent",
  governance_ethics: "Governance & Ethics"
}

export default async function AssessmentDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const locale = await getServerLocale()
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get client
  const { data: client } = await supabase
    .from("clients")
    .select()
    .eq("user_id", user?.id)
    .single()

  // Get assessment
  const { data: assessment } = await supabase
    .from("assessments")
    .select()
    .eq("id", id)
    .eq("client_id", (client as any)?.id)
    .single()

  // Get related opportunities
  const { data: opportunities } = await supabase
    .from("opportunities")
    .select()
    .eq("assessment_id", id)
    .order("priority", { ascending: true })

  const typedClient = client as unknown as Client | null
  const typedAssessment = assessment as unknown as Assessment | null
  const typedOpportunities = (opportunities as unknown as Opportunity[]) || []

  if (!typedAssessment) {
    notFound()
  }

  const dimensionScores = typedAssessment.dimension_scores || {}
  const hasExtendedAccess = Boolean(typedClient?.has_extended_access)

  if (!hasExtendedAccess) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/portal/assessments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t(locale, "assessmentDetail.reportTitle")}</h1>
            <p className="text-muted-foreground">
              {t(locale, "assessmentDetail.extendedOnly")}
            </p>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className={`h-2 ${getReadinessColor(typedAssessment.readiness_level)}`} />
          <CardContent className="p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t(locale, "assessmentDetail.latestScore")}</p>
                <div className="mt-2 text-5xl font-bold">{typedAssessment.overall_score}%</div>
                <Badge variant="outline" className="mt-3 capitalize">
                  {getReadinessLabel(typedAssessment.readiness_level, locale)}
                </Badge>
              </div>
              <div className="max-w-md space-y-3">
                <h3 className="text-xl font-semibold">{t(locale, "assessmentDetail.unlockTitle")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t(locale, "assessmentDetail.unlockDescription")}
                </p>
                <div className="flex gap-3">
                  <UnlockReportButton label={t(locale, "assessmentDetail.unlockAccess")} variant="default" />
                  <Link href="/portal/assessments">
                    <Button variant="outline">{t(locale, "assessmentDetail.backToAssessments")}</Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/portal/assessments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t(locale, "assessmentDetail.reportTitle")}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date(typedAssessment.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </p>
          </div>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          {t(locale, "assessmentDetail.downloadPdf")}
        </Button>
      </div>

      {/* Overall Score Card */}
      <Card className="overflow-hidden">
        <div className={`h-2 ${getReadinessColor(typedAssessment.readiness_level)}`} />
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <div className="flex items-center gap-6">
              <div className={`h-24 w-24 rounded-2xl flex items-center justify-center ${getReadinessColor(typedAssessment.readiness_level)}`}>
                <span className="text-3xl font-bold text-white">{typedAssessment.overall_score}%</span>
              </div>
              <div>
                <Badge variant="outline" className="mb-2 text-base capitalize">
                  {getReadinessLabel(typedAssessment.readiness_level, locale)}
                </Badge>
                <h2 className="text-2xl font-bold">{t(locale, "assessmentDetail.scoreTitle")}</h2>
              </div>
            </div>
            <div className="flex-1 md:border-l md:pl-8">
              <p className="text-muted-foreground">
                {getReadinessDescription(typedAssessment.readiness_level, locale)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dimension Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {t(locale, "assessmentDetail.dimensionBreakdown")}
          </CardTitle>
          <CardDescription>
            {t(locale, "assessmentDetail.dimensionBreakdownDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(dimensionScores).map(([key, value]) => {
              const score = value as number
              const label = dimensionLabels[key] || key.replace(/_/g, " ")
              
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{label}</span>
                    <span className="text-lg font-bold">{score}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        score >= 80 ? "bg-emerald-500" :
                        score >= 60 ? "bg-blue-500" :
                        score >= 40 ? "bg-amber-500" : "bg-orange-500"
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {score >= 80 ? "Excellent - industry-leading capabilities" :
                     score >= 60 ? "Good - strong foundation with room to grow" :
                     score >= 40 ? "Developing - building capabilities" : "Emerging - early stage, focus here"}
                  </p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              {t(locale, "assessmentDetail.strengths")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {Object.entries(dimensionScores)
                .filter(([_, value]) => (value as number) >= 60)
                .sort((a, b) => (b[1] as number) - (a[1] as number))
                .slice(0, 3)
                .map(([key, value]) => (
                  <li key={key} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium capitalize">
                        {dimensionLabels[key] || key.replace(/_/g, " ")}
                      </span>
                      <span className="text-muted-foreground ml-2">({String(value)}%)</span>
                    </div>
                  </li>
                ))}
              {Object.entries(dimensionScores).filter(([_, value]) => (value as number) >= 60).length === 0 && (
                <li className="text-muted-foreground">{t(locale, "assessmentDetail.foundationFocus")}</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              {t(locale, "assessmentDetail.improvements")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {Object.entries(dimensionScores)
                .filter(([_, value]) => (value as number) < 60)
                .sort((a, b) => (a[1] as number) - (b[1] as number))
                .slice(0, 3)
                .map(([key, value]) => (
                  <li key={key} className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium capitalize">
                        {dimensionLabels[key] || key.replace(/_/g, " ")}
                      </span>
                      <span className="text-muted-foreground ml-2">({String(value)}%)</span>
                    </div>
                  </li>
                ))}
              {Object.entries(dimensionScores).filter(([_, value]) => (value as number) < 60).length === 0 && (
                <li className="text-emerald-600 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  {t(locale, "assessmentDetail.allGood")}
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Related Opportunities */}
      {typedOpportunities.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                {t(locale, "assessmentDetail.identifiedOpportunities")}
              </CardTitle>
              <Link href="/portal/opportunities">
                <Button variant="ghost" size="sm">{t(locale, "dashboard.viewAll")}</Button>
              </Link>
            </div>
            <CardDescription>
              {t(locale, "assessmentDetail.opportunitiesFromAssessment")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {typedOpportunities.map((opportunity) => (
                <div 
                  key={opportunity.id}
                  className="flex items-start gap-4 p-4 rounded-lg bg-muted/50"
                >
                  <div className={`mt-1 h-3 w-3 rounded-full shrink-0 ${
                    opportunity.priority === "high" ? "bg-red-500" :
                    opportunity.priority === "medium" ? "bg-amber-500" : "bg-emerald-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium">{opportunity.title}</h4>
                    {opportunity.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {opportunity.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <Badge variant="outline" className="capitalize">
                        {opportunity.priority} {t(locale, "assessmentDetail.priority")}
                      </Badge>
                      {opportunity.department && (
                        <span className="text-muted-foreground">{opportunity.department}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-emerald-600">
                      ${parseFloat(String(opportunity.estimated_annual_savings || 0)).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">{t(locale, "assessmentDetail.estAnnualSavings")}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

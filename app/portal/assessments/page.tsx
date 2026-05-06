import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { FileText, Calendar, TrendingUp, ArrowRight, Zap } from "lucide-react"
import { UnlockReportButton } from "@/components/portal/unlock-report-button"
import { t } from "@/lib/i18n"
import { getServerLocale } from "@/lib/i18n-server"

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

type AssessmentRow = {
  id: string
  status: string
  created_at: string
  readiness_level: string
  overall_score: number
  dimension_scores: Record<string, number> | null
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

export default async function AssessmentsPage() {
  const locale = await getServerLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get client
  const { data: client } = await supabase
    .from("clients")
    .select()
    .eq("user_id", user?.id)
    .single()

  // Get all assessments
  const { data: assessments } = await supabase
    .from("assessments")
    .select()
    .eq("client_id", (client as { id?: string } | null)?.id)
    .order("created_at", { ascending: false })
  const hasExtendedAccess = Boolean((client as { has_extended_access?: boolean } | null)?.has_extended_access)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t(locale, "assessments.title")}</h1>
          <p className="text-muted-foreground">
            {t(locale, "assessments.subtitle")}
          </p>
        </div>
        <Link href="/">
          <Button className="gap-2">
            <Zap className="h-4 w-4" />
            {t(locale, "assessments.newAssessment")}
          </Button>
        </Link>
      </div>

      {assessments && assessments.length > 0 ? (
        <div className="grid gap-4">
          {(assessments as unknown as AssessmentRow[]).map((assessment) => (
            <Card key={assessment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${getReadinessColor(assessment.readiness_level)}`}>
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{t(locale, "assessments.cardTitle")}</h3>
                        {getStatusBadge(assessment.status, locale)}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(assessment.created_at).toLocaleDateString(locale === "uk" ? "uk-UA" : "en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5" />
                          {getReadinessLabel(assessment.readiness_level, locale)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{assessment.overall_score}%</div>
                          <div className="text-xs text-muted-foreground">{t(locale, "assessments.overallScore")}</div>
                    </div>
                    
                    {hasExtendedAccess ? (
                      <Link href={`/portal/assessments/${assessment.id}`}>
                        <Button variant="outline" className="gap-2">
                          {t(locale, "assessments.viewReport")}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    ) : (
                      <UnlockReportButton label={t(locale, "assessments.unlockReport")} className="gap-2" />
                    )}
                  </div>
                </div>

                {/* Dimension Scores Preview */}
                {assessment.dimension_scores && Object.keys(assessment.dimension_scores).length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(assessment.dimension_scores).slice(0, 4).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div className="text-lg font-semibold">{value as number}%</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {key.replace(/_/g, " ")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t(locale, "assessments.emptyTitle")}</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {t(locale, "assessments.emptyDescription")}
            </p>
            <Link href="/">
              <Button size="lg" className="gap-2">
                <Zap className="h-5 w-5" />
                {t(locale, "assessments.startFirst")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

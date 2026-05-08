import { createClient } from "@/lib/db-client/server"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Download, Calendar } from "lucide-react"
import { UnlockReportButton } from "@/components/portal/unlock-report-button"
import { PortalAssessmentFullReport } from "@/components/portal/portal-assessment-full-report"
import { dbAssessmentRowToResults } from "@/lib/assessment/db-assessment-to-results"
import { t } from "@/lib/i18n"
import { getServerLocale } from "@/lib/i18n-server"
import { cookies } from "next/headers"

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

type ReportRequestRow = {
  assessment_id: string | null
  status: string
}

const PAID_REPORT_STATUSES = new Set(["paid", "pending_manual", "ready"])

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

export default async function AssessmentDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const locale = await getServerLocale()
  const { id } = await params
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()

  // Get client
  const { data: client } = await db
    .from("clients")
    .select()
    .eq("user_id", user?.id)
    .single()

  // Get assessment
  const { data: assessment } = await db
    .from("assessments")
    .select()
    .eq("id", id)
    .eq("client_id", (client as { id?: string } | null)?.id)
    .single()

  const typedClient = client as unknown as Client | null
  const typedAssessment = assessment as unknown as Assessment | null

  if (!typedAssessment) {
    notFound()
  }

  const reportResults = dbAssessmentRowToResults(
    assessment as Record<string, unknown>,
    typedClient?.id ?? ""
  )
  const reportRequestsQuery = (db as unknown as {
    from: (table: string) => {
      select: () => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => Promise<{ data: unknown }>
        }
      }
    }
  })
  const { data: reportRequests } = await reportRequestsQuery
    .from("report_requests")
    .select()
    .eq("client_id", typedClient?.id ?? "")
    .eq("assessment_id", id)

  const hasAssessmentAccess = (((reportRequests as unknown as ReportRequestRow[] | null) ?? [])
    .some((row) => PAID_REPORT_STATUSES.has(row.status)))

  const testModeEnabled = process.env.NEXT_PUBLIC_PAYMENT_TEST_MODE === "true"
  let hasTestAccess = false
  if (testModeEnabled) {
    const cookieStore = await cookies()
    const fromCookie = cookieStore.get("test_paid_assessment_ids")?.value ?? ""
    hasTestAccess = fromCookie
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .includes(id)
  }

  if (!hasAssessmentAccess && !hasTestAccess) {
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
                  <UnlockReportButton
                    label={t(locale, "assessmentDetail.unlockAccess")}
                    variant="default"
                    clientId={typedClient?.id}
                    assessmentId={typedAssessment.id}
                    mode="charge_and_manual"
                  />
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

      <PortalAssessmentFullReport results={reportResults} />
    </div>
  )
}

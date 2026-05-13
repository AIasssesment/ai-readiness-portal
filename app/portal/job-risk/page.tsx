import { sql } from "@/lib/db"
import { getSessionUser } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { JobRiskGenerateButton } from "@/components/portal/job-risk-generate-button"
import { ShieldCheck, Building2, Clock, ArrowRight } from "lucide-react"
import { t } from "@/lib/i18n"
import { getServerLocale } from "@/lib/i18n-server"

type RiskRole = {
  id: string
  role_name: string
  department: string | null
  risk_score: number
  employee_count: number | null
  at_risk_headcount: number | null
  benchmark_risk_score: number | null
  risk_data_source: string | null
  timeline_months_min: number | null
  timeline_months_max: number | null
  reasoning: string | null
  tasks_at_risk: unknown
  tasks_safe: unknown
  reskilling_suggestions: unknown
}

function parseJsonTextArray(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.filter((item): item is string => typeof item === "string")
  }

  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input) as unknown
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string")
      }
    } catch {
      return []
    }
  }

  return []
}

function formatTimeline(min: number | null, max: number | null) {
  if (!min && !max) return "N/A"
  if (min && max) return `${min}-${max}`
  return `${min ?? max}`
}

function riskPercent(score: number) {
  return Math.min(100, Math.max(0, (score / 5) * 100))
}

export default async function JobRiskPage({
  searchParams,
}: {
  searchParams?: Promise<{ department?: string }>
}) {
  const locale = await getServerLocale()
  const user = await getSessionUser()
  if (!user) redirect(`/${locale}/auth/login`)
  const params = await searchParams
  const selectedDepartment = params?.department || "all"

  const clients = await sql<Array<{ id: string }>>`
    select id
    from clients
    where user_id = ${user.id}
    limit 1
  `
  const client = clients[0]
  if (!client) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "jobRisk.noClient")}</CardTitle>
          <CardDescription>{t(locale, "jobRisk.completeOnboarding")}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const reports = await sql<Array<{ id: string; overall_risk_score: number; executive_summary: string | null; generated_at: string }>>`
    select id, overall_risk_score, executive_summary, generated_at
    from job_risk_reports
    where client_id = ${client.id}
    order by generated_at desc
    limit 1
  `
  const latestReport = reports[0]

  if (!latestReport) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "jobRisk.reportTitle")}</CardTitle>
          <CardDescription>
            {t(locale, "jobRisk.reportHint")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">{t(locale, "jobRisk.generatePreamble")}</p>
          <JobRiskGenerateButton />
        </CardContent>
      </Card>
    )
  }

  const roles = await sql<RiskRole[]>`
    select
      id,
      role_name,
      department,
      risk_score,
      employee_count,
      at_risk_headcount,
      benchmark_risk_score,
      risk_data_source,
      timeline_months_min,
      timeline_months_max,
      reasoning,
      tasks_at_risk,
      tasks_safe,
      reskilling_suggestions
    from job_risks
    where report_id = ${latestReport.id}
    order by risk_score desc
  `

  const departments = Array.from(
    new Set(roles.map((role) => role.department).filter((department): department is string => Boolean(department))),
  )
  const filteredRoles =
    selectedDepartment === "all"
      ? roles
      : roles.filter((role) => (role.department || "").toLowerCase() === selectedDepartment.toLowerCase())
  const totalEmployees = roles.reduce((sum, role) => sum + (role.employee_count || 0), 0)
  const totalAtRisk = roles.reduce((sum, role) => sum + Number(role.at_risk_headcount || 0), 0)

  return (
    <div className="space-y-6">
      <Card className="border-border/40 bg-card/80 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>{t(locale, "jobRisk.overallDisruptionRisk")}</CardTitle>
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/15 text-emerald-200">
              {Number(latestReport.overall_risk_score).toFixed(1)} / 5
            </Badge>
          </div>
          <Progress value={riskPercent(Number(latestReport.overall_risk_score))} className="h-2 bg-muted/60" />
          <CardDescription>
            {latestReport.executive_summary || t(locale, "jobRisk.noSummary")}
          </CardDescription>
          <div className="grid gap-2 pt-1 sm:grid-cols-2">
            <div className="rounded-md border border-border/40 bg-muted/30 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{t(locale, "jobRisk.totalEmployees")}</p>
              <p className="text-lg font-semibold">{totalEmployees.toLocaleString()}</p>
            </div>
            <div className="rounded-md border border-border/40 bg-muted/30 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{t(locale, "jobRisk.atRiskEmployees")}</p>
              <p className="text-lg font-semibold text-emerald-500">{Math.round(totalAtRisk).toLocaleString()}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-muted-foreground">{t(locale, "jobRisk.filterByDepartment")}</p>
        <Link href="/portal/job-risk">
          <Badge
            variant="outline"
            className={selectedDepartment === "all"
              ? "border-primary/40 bg-primary/15 text-primary"
              : "border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted/50"}
          >
            {t(locale, "jobRisk.all")}
          </Badge>
        </Link>
        {departments.map((department) => (
          <Link key={department} href={`/portal/job-risk?department=${encodeURIComponent(department)}`}>
            <Badge
              variant="outline"
              className={selectedDepartment.toLowerCase() === department.toLowerCase()
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted/50"}
            >
              {department}
            </Badge>
          </Link>
        ))}
      </div>

      <Accordion type="single" collapsible defaultValue={roles[0]?.id} className="space-y-4">
        {filteredRoles.map((role) => (
          <AccordionItem key={role.id} value={role.id} className="overflow-hidden rounded-xl border border-border/40 bg-card/80 shadow-sm">
            <AccordionTrigger className="px-5 py-4 hover:no-underline">
              <div className="w-full space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-300">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <h3 className="text-xl font-semibold">{role.role_name}</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        {role.department || t(locale, "jobRisk.unassigned")}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTimeline(role.timeline_months_min, role.timeline_months_max)} {t(locale, "jobRisk.months")}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-3xl font-semibold leading-none text-emerald-500">
                      {Number(role.risk_score).toFixed(1)}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{t(locale, "jobRisk.risk")}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {Math.round(Number(role.at_risk_headcount || 0)).toLocaleString()} / {(role.employee_count || 0).toLocaleString()} {t(locale, "jobRisk.people")}
                    </p>
                  </div>
                </div>

                <Progress value={riskPercent(Number(role.risk_score))} className="h-2 bg-muted/60" />
              </div>
            </AccordionTrigger>

            <AccordionContent className="px-5 pb-5">
              <div className="space-y-5 border-t border-border/30 pt-5">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t(locale, "jobRisk.whyThisRisk")}</p>
                  <p className="text-sm text-foreground/90">{role.reasoning || t(locale, "jobRisk.noReasoning")}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 rounded-lg border border-red-500/15 bg-red-500/5 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-300">{t(locale, "jobRisk.tasksAtRisk")}</p>
                    <ul className="space-y-1.5 text-sm">
                      {parseJsonTextArray(role.tasks_at_risk).slice(0, 4).map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2 rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">{t(locale, "jobRisk.durablyHuman")}</p>
                    <ul className="space-y-1.5 text-sm">
                      {parseJsonTextArray(role.tasks_safe).slice(0, 4).map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border border-border/35 bg-muted/20 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t(locale, "jobRisk.reskillingRoadmap")}</p>
                  <ul className="space-y-1.5 text-sm">
                    {parseJsonTextArray(role.reskilling_suggestions).slice(0, 4).map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {filteredRoles.length === 0 && (
        <Card className="border-border/40 bg-card/80">
          <CardContent className="py-6 text-sm text-muted-foreground">
            {t(locale, "jobRisk.noRolesForDepartment")}
          </CardContent>
        </Card>
      )}

      <JobRiskGenerateButton />
    </div>
  )
}

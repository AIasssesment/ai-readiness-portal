import { sql } from "@/lib/db"
import { getSessionUser } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { JobRiskGenerateButton } from "@/components/portal/job-risk-generate-button"

type RiskRole = {
  id: string
  role_name: string
  department: string | null
  risk_score: number
  timeline_months_min: number | null
  timeline_months_max: number | null
  reasoning: string | null
}

export default async function JobRiskPage() {
  const user = await getSessionUser()
  if (!user) redirect("/auth/login")

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
          <CardTitle>No client profile found</CardTitle>
          <CardDescription>Complete assessment onboarding first.</CardDescription>
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
          <CardTitle>Job Risk Report</CardTitle>
          <CardDescription>
            Generate role-by-role disruption risk, timelines, and reskilling guidance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JobRiskGenerateButton />
        </CardContent>
      </Card>
    )
  }

  const roles = await sql<RiskRole[]>`
    select id, role_name, department, risk_score, timeline_months_min, timeline_months_max, reasoning
    from job_risks
    where report_id = ${latestReport.id}
    order by risk_score desc
  `

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Overall disruption risk: {latestReport.overall_risk_score}/5</CardTitle>
          <CardDescription>{latestReport.executive_summary || "No summary available"}</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{role.role_name}</h3>
                  <p className="text-sm text-muted-foreground">{role.department || "Unassigned department"}</p>
                  <p className="mt-2 text-sm">{role.reasoning || "No reasoning available"}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline">Risk {role.risk_score}/5</Badge>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Timeline: {role.timeline_months_min ?? "?"}-{role.timeline_months_max ?? "?"} months
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <JobRiskGenerateButton />
    </div>
  )
}

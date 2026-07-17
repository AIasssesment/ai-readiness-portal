import { sql } from "@/lib/db"
import { getJobRiskAccessByClientId } from "@/lib/job-risk/access"

type ContextData = {
  companyName: string
  industry: string | null
  companySize: string | null
  score: number | null
  readinessLevel: string | null
  dimensionScores: Record<string, number>
  opportunities: Array<{ title: string; estimated_annual_savings: number | string; estimated_hours_saved_weekly: number }>
  jobRisk: {
    overallRiskScore: number
    executiveSummary: string
    highestRiskRoles: Array<{ role_name: string; department: string | null; risk_score: number; timeline_months_min: number | null; timeline_months_max: number | null }>
  } | null
}

type HighestRiskRole = {
  role_name: string
  department: string | null
  risk_score: number
  timeline_months_min: number | null
  timeline_months_max: number | null
}

function toDimensionString(scores: Record<string, number>) {
  const entries = Object.entries(scores)
  if (entries.length === 0) return "No dimension scores available"
  return entries.map(([key, value]) => `${key}: ${value}`).join(", ")
}

export async function getChatContext(clientId: string): Promise<ContextData> {
  const clients = await sql<Array<{ company_name: string; industry: string | null; company_size: string | null }>>`
    select company_name, industry, company_size
    from clients
    where id = ${clientId}
    limit 1
  `
  const client = clients[0]

  const assessments = await sql<Array<{ id: string; overall_score: number; readiness_level: string; dimension_scores: Record<string, number> | null }>>`
    select id, overall_score, readiness_level, dimension_scores
    from assessments
    where client_id = ${clientId}
    order by created_at desc
    limit 1
  `
  const latestAssessment = assessments[0]

  const opportunities = await sql<Array<{ title: string; estimated_annual_savings: number | string; estimated_hours_saved_weekly: number }>>`
    select title, estimated_annual_savings, estimated_hours_saved_weekly
    from opportunities
    where client_id = ${clientId}
      and publication_status = 'published'
    order by estimated_annual_savings desc
    limit 3
  `

  // Job Risk is a gated product: only surface it in chat once the client has access.
  const jobRiskAccess = await getJobRiskAccessByClientId(clientId)
  const reports = jobRiskAccess.hasAccess
    ? await sql<Array<{ id: string; overall_risk_score: number; executive_summary: string | null }>>`
        select id, overall_risk_score, executive_summary
        from job_risk_reports
        where client_id = ${clientId}
        order by generated_at desc
        limit 1
      `
    : []
  const latestReport = reports[0]

  let highestRiskRoles: HighestRiskRole[] = []
  if (latestReport) {
    highestRiskRoles = await sql<Array<{ role_name: string; department: string | null; risk_score: number; timeline_months_min: number | null; timeline_months_max: number | null }>>`
      select role_name, department, risk_score, timeline_months_min, timeline_months_max
      from job_risks
      where report_id = ${latestReport.id}
      order by risk_score desc
      limit 3
    `
  }

  return {
    companyName: client?.company_name || "Unknown Company",
    industry: client?.industry || null,
    companySize: client?.company_size || null,
    score: latestAssessment?.overall_score ?? null,
    readinessLevel: latestAssessment?.readiness_level ?? null,
    dimensionScores: latestAssessment?.dimension_scores || {},
    opportunities,
    jobRisk: latestReport
      ? {
          overallRiskScore: latestReport.overall_risk_score,
          executiveSummary: latestReport.executive_summary || "No summary available",
          highestRiskRoles,
        }
      : null,
  }
}

export function buildChatContext(context: ContextData) {
  const opportunitiesText =
    context.opportunities.length > 0
      ? context.opportunities
          .map(
            (opp) =>
              `- ${opp.title}: €${Number(opp.estimated_annual_savings || 0).toLocaleString()} annual, ${opp.estimated_hours_saved_weekly} hours/week`,
          )
          .join("\n")
      : "- No opportunities data available"

  const jobRiskText = context.jobRisk
    ? `Job Risk Snapshot
Overall disruption risk: ${context.jobRisk.overallRiskScore}/5
Summary: ${context.jobRisk.executiveSummary}
Highest-risk roles:
${context.jobRisk.highestRiskRoles
  .map(
    (r) =>
      `- ${r.role_name} (${r.department || "N/A"}) — risk ${r.risk_score}/5 — ${r.timeline_months_min ?? "?"}-${r.timeline_months_max ?? "?"} months`,
  )
  .join("\n")}`
    : "Job Risk Snapshot\nNo job risk report generated yet."

  return `You are AI Advisor, an experienced AI/automation consultant embedded in the user's portal.

Your job:
- Answer questions about the user's AI Maturity assessment, their opportunities, their job-risk report, and practical next steps.
- Be concise. Default to 3-6 sentences unless user asks for depth.
- Use markdown: short bullet lists, bold key numbers (EUR, hours saved, weeks).
- When recommending an action, suggest a specific tool, rough cost, and realistic timeframe.
- If user asks for data not available, say so and ask one clarifying question.
- Never invent numbers.
- Speak in a calm, peer-to-peer tone.

Client context:
Company: ${context.companyName}
Industry: ${context.industry || "N/A"}
Company size: ${context.companySize || "N/A"}
Latest AI Maturity Score: ${context.score ?? "N/A"}/100 (${context.readinessLevel || "N/A"})
Dimension scores: ${toDimensionString(context.dimensionScores)}

Top opportunities:
${opportunitiesText}

${jobRiskText}`
}

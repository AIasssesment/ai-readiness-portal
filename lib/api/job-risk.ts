import "server-only"

import { backendFetch } from "@/lib/api/backend"
import { sql } from "@/lib/db"

export type JobRiskAccess = {
  clientId: string | null
  hasClient: boolean
  linkedin: string | null
  hasLinkedin: boolean
  hasPaid: boolean
  hasExtendedAccess: boolean
  hasAccess: boolean
}

export type NestJobRiskRole = {
  id: string
  roleName: string
  department: string | null
  riskScore: number
  timelineMonthsMin: number | null
  timelineMonthsMax: number | null
  tasksAtRisk: unknown
  tasksSafe: unknown
  reskillingSuggestions: unknown
  reasoning: string | null
  employeeCount: number | null
  atRiskHeadcount: number | null
  benchmarkRiskScore: number | null
  riskDataSource: string | null
}

export type NestJobRiskReport = {
  id: string
  clientId: string
  assessmentId: string | null
  overallRiskScore: number
  executiveSummary: string | null
  generatedAt: string
  risks: NestJobRiskRole[]
}

export type NestCompanyEnrichment = {
  id: string
  clientId: string
  linkedinUrl: string
  status: string
  normalized: {
    company?: { name?: string | null; about?: string | null }
    detected_jobs?: unknown[]
    implied_roles?: unknown[]
  } | null
  error: string | null
  fetchedAt: string | null
}

export type PortalJobRiskRole = {
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

export type PortalJobRiskReport = {
  id: string
  overall_risk_score: number
  executive_summary: string | null
  generated_at: string
  roles: PortalJobRiskRole[]
}

function canCallNestBackend() {
  const hasToken = Boolean(process.env.INTERNAL_API_TOKEN?.trim())
  const hasBase = Boolean(
    process.env.API_URL?.trim() ||
      process.env.BACKEND_URL?.trim() ||
      process.env.NEXT_PUBLIC_API_BASE_URL?.trim(),
  )
  return hasToken && hasBase
}

export async function fetchJobRiskAccess(clientId: string): Promise<JobRiskAccess> {
  return backendFetch<JobRiskAccess>(`/clients/${clientId}/job-risk/access`, {
    method: "GET",
    clientId,
  })
}

export async function fetchLatestJobRiskReport(clientId: string) {
  return backendFetch<{ report: NestJobRiskReport | null }>(
    `/clients/${clientId}/job-risk/reports/latest`,
    {
      method: "GET",
      clientId,
    },
  )
}

export async function fetchCompanyEnrichment(clientId: string) {
  return backendFetch<{ enrichment: NestCompanyEnrichment | null }>(
    `/clients/${clientId}/company-enrichment`,
    {
      method: "GET",
      clientId,
    },
  )
}

/** UI / page shape used by portal Job Risk (snake_case). */
export function nestReportToPortalShape(report: NestJobRiskReport): PortalJobRiskReport {
  return {
    id: report.id,
    overall_risk_score: report.overallRiskScore,
    executive_summary: report.executiveSummary,
    generated_at: report.generatedAt,
    roles: report.risks.map((risk) => ({
      id: risk.id,
      role_name: risk.roleName,
      department: risk.department,
      risk_score: risk.riskScore,
      employee_count: risk.employeeCount,
      at_risk_headcount: risk.atRiskHeadcount,
      benchmark_risk_score: risk.benchmarkRiskScore,
      risk_data_source: risk.riskDataSource,
      timeline_months_min: risk.timelineMonthsMin,
      timeline_months_max: risk.timelineMonthsMax,
      reasoning: risk.reasoning,
      tasks_at_risk: risk.tasksAtRisk,
      tasks_safe: risk.tasksSafe,
      reskilling_suggestions: risk.reskillingSuggestions,
    })),
  }
}

async function loadPortalJobRiskReportFromSql(clientId: string): Promise<PortalJobRiskReport | null> {
  const reports = await sql<
    Array<{
      id: string
      overall_risk_score: number
      executive_summary: string | null
      generated_at: string
    }>
  >`
    select id, overall_risk_score, executive_summary, generated_at
    from job_risk_reports
    where client_id = ${clientId}
    order by generated_at desc
    limit 1
  `
  const latestReport = reports[0]
  if (!latestReport) return null

  const roles = await sql<PortalJobRiskRole[]>`
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

  return {
    id: latestReport.id,
    overall_risk_score: latestReport.overall_risk_score,
    executive_summary: latestReport.executive_summary,
    generated_at: latestReport.generated_at,
    roles,
  }
}

async function loadCompanyEnrichmentFromSql(
  clientId: string,
): Promise<{ enrichment: NestCompanyEnrichment | null }> {
  const rows = await sql<
    Array<{
      id: string
      client_id: string
      status: string
      linkedin_url: string
      error: string | null
      fetched_at: Date | string | null
      normalized: NestCompanyEnrichment["normalized"]
    }>
  >`
    select id, client_id, status, linkedin_url, error, fetched_at, normalized
    from company_enrichment
    where client_id = ${clientId}::uuid
    limit 1
  `
  const row = rows[0]
  if (!row) return { enrichment: null }

  return {
    enrichment: {
      id: row.id,
      clientId: row.client_id,
      linkedinUrl: row.linkedin_url,
      status: row.status,
      normalized: row.normalized,
      error: row.error,
      fetchedAt: row.fetched_at ? String(row.fetched_at) : null,
    },
  }
}

/** Nest-first report load with SQL fallback for production resilience. */
export async function loadPortalJobRiskReport(clientId: string): Promise<PortalJobRiskReport | null> {
  if (canCallNestBackend()) {
    try {
      const payload = await fetchLatestJobRiskReport(clientId)
      return payload.report ? nestReportToPortalShape(payload.report) : null
    } catch (error) {
      console.error("Nest latest job-risk report failed; falling back to SQL", error)
    }
  }
  return loadPortalJobRiskReportFromSql(clientId)
}

/** Nest-first enrichment load with SQL fallback. */
export async function loadCompanyEnrichment(clientId: string) {
  if (canCallNestBackend()) {
    try {
      return await fetchCompanyEnrichment(clientId)
    } catch (error) {
      console.error("Nest company enrichment failed; falling back to SQL", error)
    }
  }
  return loadCompanyEnrichmentFromSql(clientId)
}

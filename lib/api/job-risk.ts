import "server-only"

import { backendFetch } from "@/lib/api/backend"

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
export function nestReportToPortalShape(report: NestJobRiskReport) {
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

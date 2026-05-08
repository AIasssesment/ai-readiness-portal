import type { AssessmentAnswer, AssessmentResults, CompanyInfo, DimensionScores } from "@/lib/types"

export function readinessLevelToTier(level: string): AssessmentResults["tier"] {
  switch (level) {
    case "leader":
      return "high"
    case "advanced":
      return "good"
    case "developing":
      return "early"
    case "emerging":
      return "explore"
    default:
      return "explore"
  }
}

function emptyCompanyInfo(): CompanyInfo {
  return {
    firstName: "",
    lastName: "",
    companyName: "Company",
    email: "",
  }
}

/** Map a DB `assessments` row to `AssessmentResults` (same shape as client store after save). */
export function dbAssessmentRowToResults(row: Record<string, unknown>, clientId: string): AssessmentResults {
  const raw = (row.dimension_scores as Record<string, number> | null) ?? {}
  const answers = (Array.isArray(row.answers) ? row.answers : []) as AssessmentAnswer[]
  const companyInfo = (row.company_info as CompanyInfo | null) ?? emptyCompanyInfo()

  const dimensionScores: DimensionScores = {
    process: Number(raw.process ?? 0),
    tech: Number(raw.tech ?? 0),
    org: Number(raw.org ?? 0),
    roi: Number(raw.roi ?? 0),
    size: raw.size != null ? Number(raw.size) : undefined,
  }

  return {
    companyInfo,
    answers,
    overallScore: Number(row.overall_score ?? 0),
    dimensionScores,
    tier: readinessLevelToTier(String(row.readiness_level ?? "emerging")),
    savedAssessmentId: String(row.id ?? ""),
    savedClientId: clientId,
  }
}

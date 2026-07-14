import type { z } from "zod"
import {
  dedupeByTitle,
  normalizeComplexity,
  normalizePriority,
  normalizeStatus,
  normalizeTimeline,
} from "@/lib/opportunities/normalize"
import type { GeneratedOpportunitySchema } from "@/lib/opportunities/schemas"
import {
  cleanEvidenceItems,
  clampAssumptionsForCompany,
  computeAnnualSavingsUsd,
  computeWeeklyHoursSaved,
  primaryDepartment,
  sanitizeDecisionMakers,
  type SavingsAssumptions,
} from "@/lib/opportunities/savings"

type GeneratedOpportunity = z.infer<typeof GeneratedOpportunitySchema>

export function normalizeSavingsAssumptions(
  raw: GeneratedOpportunity["savings_assumptions"],
): SavingsAssumptions {
  return {
    affected_headcount: Number(raw.affected_headcount) || 0,
    hours_per_person_per_week:
      Number(raw.hours_saved_per_person_per_week ?? raw.hours_per_person_per_week) || 0,
    blended_hourly_rate_usd: Number(raw.blended_hourly_rate_usd) || 0,
    efficiency: Number(raw.automation_efficiency ?? raw.efficiency) || 0,
  }
}

export function normalizeSavingsConfidence(raw: string | null | undefined, confidenceScore: number): string {
  const v = (raw || "").toLowerCase().trim()
  if (v.includes("high")) return "High"
  if (v.includes("low")) return "Low"
  if (v.includes("medium") || v.includes("med")) return "Medium"
  if (confidenceScore >= 80) return "High"
  if (confidenceScore < 60) return "Low"
  return "Medium"
}

/**
 * Deterministic cold pass from ai-opportunity-pipeline.md:
 * enums, savings in code, drop relevance < 50, dedupe, sort by savings × relevance.
 */
export function postprocessOpportunities(
  opportunities: GeneratedOpportunity[],
  companySize: string | null,
) {
  const processed = dedupeByTitle(opportunities)
    .map((opp) => {
      const relevance = Math.max(0, Math.min(100, Math.round(opp.relevance_score)))
      const confidence = Math.max(0, Math.min(100, Math.round(opp.confidence_score)))
      const assumptions = clampAssumptionsForCompany(
        normalizeSavingsAssumptions(opp.savings_assumptions),
        companySize,
      )
      const estimatedAnnualSavings = computeAnnualSavingsUsd(assumptions)
      const estimatedHoursWeekly = computeWeeklyHoursSaved(assumptions)
      const evidence = cleanEvidenceItems(opp.source_evidence)
      const decisionMakers = sanitizeDecisionMakers(opp.decision_makers)
      const savingsConfidence = normalizeSavingsConfidence(opp.savings_confidence, confidence)

      return {
        title: opp.title.trim(),
        description: opp.summary.trim(),
        department: primaryDepartment(opp.department),
        complexity: normalizeComplexity(opp.complexity),
        estimated_hours_saved_weekly: Math.round(estimatedHoursWeekly),
        estimated_annual_savings: estimatedAnnualSavings,
        priority: normalizePriority(opp.priority),
        implementation_timeline: normalizeTimeline(opp.timeline),
        status: normalizeStatus(opp.status || "identified"),
        notes: null as string | null,
        source: "ai" as const,
        pain_points: (opp.pain_points ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 8),
        decision_makers: decisionMakers,
        why_relevant: opp.why_relevant,
        relevance_score: relevance,
        confidence_score: confidence,
        savings_assumptions: assumptions,
        business_problem: opp.business_problem,
        proposed_solution: opp.proposed_solution,
        details: {
          expected_roi: opp.expected_roi?.trim() || undefined,
          savings_confidence: savingsConfidence,
          capabilities: (opp.required_ai_capabilities ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 8),
          integrations: (opp.required_integrations ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 8),
          evidence,
        },
      }
    })
    .filter((opp) => opp.relevance_score >= 50)
    .sort(
      (a, b) =>
        b.estimated_annual_savings * b.relevance_score - a.estimated_annual_savings * a.relevance_score,
    )

  return processed
}

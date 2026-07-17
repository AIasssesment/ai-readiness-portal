import { z } from "zod"

const nullableString = z.string().nullable().optional()

/** Stage 1 profile — aligned with ai-opportunity-pipeline.md */
export const CompanyIntelligenceSchema = z.object({
  company_name: z.string().min(1),
  website: nullableString,
  linkedin: nullableString,
  industry: nullableString,
  business_model: nullableString,
  employee_count: z.union([z.number(), z.string(), z.null()]).optional(),
  headquarters: nullableString,
  countries: z.array(z.string()).max(30),
  core_products_services: z.array(z.string()).max(20),
  departments: z.array(z.string()).max(25),
  tech_stack: z.array(z.string()).max(30),
  hiring_signals: z.array(z.string()).max(20),
  recent_news: z.array(z.string()).max(15),
  funding: nullableString,
  likely_data_sources: z.array(z.string()).max(20),
  confirmed_pain_points: z.array(z.string()).max(20),
  inferred_signals: z
    .array(
      z.object({
        signal: z.string().min(3),
        rationale: z.string().min(3),
      }),
    )
    .max(20),
  sources: z.array(z.string()).max(30),
  assessment_context: z
    .object({
      overall_score: z.number().optional(),
      readiness_level: z.string().optional(),
      dimension_scores: z.record(z.number()).optional(),
      answer_highlights: z.array(z.string()).max(30).optional(),
      workforce: z
        .array(
          z.object({
            role_title: z.string(),
            department: z.string().nullable().optional(),
            employee_count: z.number().optional(),
          }),
        )
        .max(50)
        .optional(),
    })
    .optional(),
})

export type CompanyIntelligenceProfile = z.infer<typeof CompanyIntelligenceSchema>

/**
 * LLM output bounds are intentionally wide so generateObject does not fail
 * when the model is optimistic. Real caps live in postprocess/clampAssumptionsForCompany.
 */
export const SavingsAssumptionsSchema = z.object({
  affected_headcount: z.number().min(0).max(100_000),
  hours_saved_per_person_per_week: z.number().min(0).max(168).optional(),
  hours_per_person_per_week: z.number().min(0).max(168).optional(),
  blended_hourly_rate_usd: z.number().min(0).max(2_000),
  automation_efficiency: z.number().min(0).max(1).optional(),
  efficiency: z.number().min(0).max(1).optional(),
})

export const GeneratedOpportunitySchema = z.object({
  title: z.string().min(3).max(200),
  summary: z.string().min(10).max(2_000),
  department: z.string().min(1).max(120),
  priority: z.string(),
  complexity: z.string(),
  timeline: z.string(),
  status: z.string().optional(),
  business_problem: z.string().min(5).max(2_000),
  proposed_solution: z.string().min(5).max(2_000),
  expected_roi: z.string().min(1).max(500),
  savings_confidence: z.string().optional(),
  estimated_time_savings_hours_per_week: z.number().min(0).max(100_000).optional(),
  relevance_score: z.number().min(0).max(100),
  confidence_score: z.number().min(0).max(100),
  why_relevant: z.string().min(5).max(2_000),
  pain_points: z.array(z.string()).max(12),
  decision_makers: z.array(z.string()).max(12),
  required_ai_capabilities: z.array(z.string()).max(15),
  required_integrations: z.array(z.string()).max(15),
  source_evidence: z.array(z.string()).max(15),
  savings_assumptions: SavingsAssumptionsSchema,
})

export const OpportunityBatchSchema = z.object({
  opportunities: z.array(GeneratedOpportunitySchema).min(5).max(15),
})

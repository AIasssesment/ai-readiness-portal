import { generateObject, generateText } from "ai"
import { sql } from "@/lib/db"
import { getGoogleSearchTool, getLlmModel, isGoogleAiConfigured } from "@/lib/ai/model"
import {
  buildAssessmentAnswerHighlights,
  extractWebsiteCandidate,
} from "@/lib/opportunities/assessment-context"
import { postprocessOpportunities } from "@/lib/opportunities/postprocess"
import {
  buildCompanyIntelligenceUserPrompt,
  buildOpportunityGeneratorUserPrompt,
  COMPANY_INTELLIGENCE_SYSTEM,
  OPPORTUNITY_GENERATOR_SYSTEM,
} from "@/lib/opportunities/prompts"
import { CompanyIntelligenceSchema, OpportunityBatchSchema } from "@/lib/opportunities/schemas"
import {
  normalizeComplexity,
  normalizePriority,
  normalizeStatus,
  normalizeTimeline,
} from "@/lib/opportunities/normalize"
import {
  clampAssumptionsForCompany,
  computeAnnualSavingsUsd,
  computeWeeklyHoursSaved,
  primaryDepartment,
  type OpportunityDetails,
  type SavingsAssumptions,
} from "@/lib/opportunities/savings"

/** Error carrying an HTTP status so route handlers can map it directly. */
export class OpportunityServiceError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = "OpportunityServiceError"
  }
}

export type GenerationStage = "loading" | "research" | "profile" | "generating" | "scoring" | "saving"

export type ProfileSummary = {
  industry: string | null
  business_model: string | null
  employee_count: string | number | null
  headquarters: string | null
  departments: string[]
  core_products_services: string[]
  tech_stack: string[]
  confirmed_pain_points: string[]
  recent_news: string[]
  sources_count: number
}

export type GenerationEvent =
  | { type: "stage"; stage: GenerationStage; status: "start" | "done"; message?: string }
  | { type: "profile"; summary: ProfileSummary }
  | { type: "done"; count: number }
  | { type: "error"; status: number; message: string }

type ProgressFn = (event: GenerationEvent) => void

function toStringList(value: unknown, max = 8): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, max)
}

const DEFAULT_DEPARTMENTS = [
  "Operations",
  "Sales",
  "Marketing",
  "Customer Support",
  "Finance",
  "Human Resources",
]

/** Guarantee a non-empty department list, preferring workforce data. */
function ensureDepartments(
  fromLlm: unknown,
  workforce: Array<{ department: string | null }>,
): string[] {
  const llm = toStringList(fromLlm, 25)
  if (llm.length) return llm

  const fromWorkforce = Array.from(
    new Set(
      workforce
        .map((w) => (w.department ?? "").trim())
        .filter(Boolean),
    ),
  ).slice(0, 25)
  if (fromWorkforce.length) return fromWorkforce

  return DEFAULT_DEPARTMENTS
}

async function runCompanyIntelligence(
  input: {
    companyName: string
    website: string | null
    industry: string | null
    companySize: string | null
    description: string | null
    overallScore: number
    readinessLevel: string
    dimensionScores: unknown
    assessmentAnswerHighlights: string[]
    workforce: Array<{ role_title: string; department: string | null; employee_count: number }>
  },
  onProgress?: ProgressFn,
) {
  const userPrompt = buildCompanyIntelligenceUserPrompt({
    companyName: input.companyName,
    website: input.website,
    industry: input.industry,
    companySize: input.companySize,
    description: input.description,
    overallScore: input.overallScore,
    readinessLevel: input.readinessLevel,
    dimensionScores: input.dimensionScores,
    assessmentAnswerHighlights: input.assessmentAnswerHighlights,
    workforce: input.workforce,
  })

  // Stage 1a — research with Google Search grounded tool
  onProgress?.({ type: "stage", stage: "research", status: "start" })
  let researchNotes = ""
  try {
    const researched = await generateText({
      model: getLlmModel(),
      // Provider-defined Gemini search tool; cast avoids Tool<> variance mismatch across SDK packages.
      tools: {
        google_search: getGoogleSearchTool(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      system: COMPANY_INTELLIGENCE_SYSTEM,
      prompt: `${userPrompt}

Use google search where needed. Write a dense factual research brief covering:
website, industry, business model, employee count, headquarters/countries,
products/services, departments, tech stack, hiring signals, recent news, funding,
pain points, and source URLs. Mark inferences explicitly.`,
      temperature: 0.3,
      maxOutputTokens: 4000,
    })
    researchNotes = researched.text?.trim() || ""
  } catch (error) {
    console.warn("company intelligence web search failed; continuing with portal data", error)
  }
  onProgress?.({
    type: "stage",
    stage: "research",
    status: "done",
    message: researchNotes ? "Web research complete" : "Web research unavailable — using portal data",
  })

  // Stage 1b — coerce into schema (no web search)
  onProgress?.({ type: "stage", stage: "profile", status: "start" })
  const { object: intelligence } = await generateObject({
    model: getLlmModel(),
    schema: CompanyIntelligenceSchema,
    system: `${COMPANY_INTELLIGENCE_SYSTEM}

You are now normalizing research into the exact schema. Do not invent facts.
If a field is unknown, use null or []. Always preserve assessment_context from known portal data.`,
    prompt: `${userPrompt}

Research brief from web search (may be empty if search failed):
${researchNotes || "(no web research notes — use only known portal fields and mark gaps as null)"}

Return the company intelligence profile JSON.`,
    temperature: 0.2,
  })

  // The LLM can return no departments for thin profiles; fall back to the
  // workforce data or a generic set so opportunity generation still has anchors.
  const departments = ensureDepartments(intelligence.departments, input.workforce)

  onProgress?.({ type: "stage", stage: "profile", status: "done" })
  onProgress?.({
    type: "profile",
    summary: {
      industry: intelligence.industry ?? null,
      business_model: intelligence.business_model ?? null,
      employee_count: intelligence.employee_count ?? null,
      headquarters: intelligence.headquarters ?? null,
      departments: toStringList(departments),
      core_products_services: toStringList(intelligence.core_products_services),
      tech_stack: toStringList(intelligence.tech_stack),
      confirmed_pain_points: toStringList(intelligence.confirmed_pain_points),
      recent_news: toStringList(intelligence.recent_news, 5),
      sources_count: Array.isArray(intelligence.sources) ? intelligence.sources.length : 0,
    },
  })

  return {
    ...intelligence,
    departments,
    assessment_context: {
      ...(intelligence.assessment_context || {}),
      overall_score: input.overallScore,
      readiness_level: input.readinessLevel,
      dimension_scores: (input.dimensionScores as Record<string, number> | null) || undefined,
      answer_highlights: input.assessmentAnswerHighlights,
      workforce: input.workforce,
    },
  }
}

/** Two-stage AI generation for a specific client. Replaces the client's ai/assessment rows. */
export async function generateOpportunitiesForClient(
  clientId: string,
  options?: { onProgress?: ProgressFn },
): Promise<{ count: number }> {
  const onProgress = options?.onProgress

  if (!isGoogleAiConfigured()) {
    throw new OpportunityServiceError(500, "GOOGLE_GENERATIVE_AI_API_KEY is not configured")
  }

  onProgress?.({ type: "stage", stage: "loading", status: "start" })

  const clients = await sql<
    Array<{
      id: string
      company_name: string
      industry: string | null
      company_size: string | null
      website: string | null
      description: string | null
    }>
  >`
    select id, company_name, industry, company_size, website, description
    from clients
    where id = ${clientId}::uuid
    limit 1
  `
  const client = clients[0]
  if (!client) {
    throw new OpportunityServiceError(404, "Client profile not found")
  }

  const latestAssessments = await sql<
    Array<{
      id: string
      overall_score: number
      readiness_level: string
      dimension_scores: Record<string, number> | null
      company_info: unknown
      answers: unknown
    }>
  >`
    select id, overall_score, readiness_level, dimension_scores, company_info, answers
    from assessments
    where client_id = ${client.id}
    order by created_at desc
    limit 1
  `
  const latestAssessment = latestAssessments[0]
  if (!latestAssessment) {
    throw new OpportunityServiceError(400, "Assessment required before generating opportunities")
  }

  const workforce = await sql<
    Array<{ role_title: string; department: string | null; employee_count: number }>
  >`
    select role_title, department, employee_count
    from workforce_roles
    where client_id = ${client.id}
    order by employee_count desc
    limit 50
  `

  const assessmentAnswerHighlights = buildAssessmentAnswerHighlights(latestAssessment.answers)
  const website =
    client.website ||
    extractWebsiteCandidate(latestAssessment.company_info, client.company_name)

  onProgress?.({ type: "stage", stage: "loading", status: "done" })

  const intelligence = await runCompanyIntelligence(
    {
      companyName: client.company_name,
      website,
      industry: client.industry,
      companySize: client.company_size,
      description: client.description,
      overallScore: latestAssessment.overall_score,
      readinessLevel: latestAssessment.readiness_level,
      dimensionScores: latestAssessment.dimension_scores,
      assessmentAnswerHighlights,
      workforce,
    },
    onProgress,
  )

  await sql`
    insert into company_intelligence (client_id, assessment_id, profile, source, updated_at)
    values (${client.id}, ${latestAssessment.id}, ${sql.json(intelligence)}, 'llm', now())
    on conflict (client_id)
    do update set
      assessment_id = excluded.assessment_id,
      profile = excluded.profile,
      source = excluded.source,
      updated_at = now()
  `

  onProgress?.({ type: "stage", stage: "generating", status: "start" })
  const { object: batch } = await generateObject({
    model: getLlmModel(),
    schema: OpportunityBatchSchema,
    system: OPPORTUNITY_GENERATOR_SYSTEM,
    prompt: buildOpportunityGeneratorUserPrompt(intelligence),
    temperature: 0.6,
  })
  onProgress?.({ type: "stage", stage: "generating", status: "done" })

  onProgress?.({ type: "stage", stage: "scoring", status: "start" })
  const processed = postprocessOpportunities(batch.opportunities, client.company_size)

  if (processed.length === 0) {
    throw new OpportunityServiceError(
      502,
      "No opportunities passed relevance threshold (≥50). Try again or enrich company profile.",
    )
  }
  onProgress?.({
    type: "stage",
    stage: "scoring",
    status: "done",
    message: `${processed.length} opportunities passed relevance ≥50`,
  })

  onProgress?.({ type: "stage", stage: "saving", status: "start" })
  await sql`
    delete from opportunities
    where client_id = ${client.id}
      and source in ('ai', 'assessment')
      and publication_status = 'draft'
  `

  for (const opp of processed) {
    await sql`
      insert into opportunities (
        assessment_id, client_id, title, description, department, complexity,
        estimated_hours_saved_weekly, estimated_annual_savings, priority,
        implementation_timeline, status, notes, source, pain_points, decision_makers,
        why_relevant, relevance_score, confidence_score, savings_assumptions,
        business_problem, proposed_solution, details, publication_status
      ) values (
        ${latestAssessment.id}, ${client.id}, ${opp.title}, ${opp.description}, ${opp.department}, ${opp.complexity},
        ${opp.estimated_hours_saved_weekly}, ${opp.estimated_annual_savings}, ${opp.priority},
        ${opp.implementation_timeline}, ${opp.status}, ${opp.notes}, ${opp.source}, ${sql.json(opp.pain_points)}, ${sql.json(opp.decision_makers)},
        ${opp.why_relevant}, ${opp.relevance_score}, ${opp.confidence_score}, ${sql.json(opp.savings_assumptions)},
        ${opp.business_problem}, ${opp.proposed_solution}, ${sql.json(opp.details)}, 'draft'
      )
    `
  }
  onProgress?.({ type: "stage", stage: "saving", status: "done" })

  return { count: processed.length }
}

export type ManualOpportunityInput = {
  title?: string
  description?: string
  department?: string
  priority?: string
  complexity?: string
  timeline?: string
  status?: string
  business_problem?: string
  proposed_solution?: string
  why_relevant?: string
  notes?: string
  savings_assumptions?: Partial<SavingsAssumptions>
  estimated_annual_savings?: number
  estimated_hours_saved_weekly?: number
}

export type PublicationStatus = "draft" | "published"

export type UpdateOpportunityInput = ManualOpportunityInput & {
  publication_status?: PublicationStatus
  pain_points?: string[]
  decision_makers?: string[]
  relevance_score?: number | null
  confidence_score?: number | null
  details?: OpportunityDetails
}

/** Insert a manual opportunity for a specific client. */
export async function createManualOpportunity(
  clientId: string,
  body: ManualOpportunityInput,
): Promise<{ id: string }> {
  const clients = await sql<Array<{ id: string; company_size: string | null }>>`
    select id, company_size from clients where id = ${clientId}::uuid limit 1
  `
  const client = clients[0]
  if (!client) {
    throw new OpportunityServiceError(404, "Client profile not found")
  }

  const title = body.title?.trim()
  if (!title || title.length < 3) {
    throw new OpportunityServiceError(400, "Title is required")
  }

  const assessments = await sql<Array<{ id: string }>>`
    select id from assessments
    where client_id = ${client.id}
    order by created_at desc
    limit 1
  `
  const assessmentId = assessments[0]?.id ?? null

  const a = body.savings_assumptions
  const rawAssumptions: SavingsAssumptions | null =
    a &&
    Number.isFinite(Number(a.affected_headcount)) &&
    Number.isFinite(Number(a.hours_per_person_per_week)) &&
    Number.isFinite(Number(a.blended_hourly_rate_usd)) &&
    Number.isFinite(Number(a.efficiency))
      ? {
          affected_headcount: Number(a.affected_headcount),
          hours_per_person_per_week: Number(a.hours_per_person_per_week),
          blended_hourly_rate_usd: Number(a.blended_hourly_rate_usd),
          efficiency: Number(a.efficiency),
        }
      : null

  const assumptions = rawAssumptions
    ? clampAssumptionsForCompany(rawAssumptions, client.company_size)
    : null

  const estimatedAnnualSavings = assumptions
    ? computeAnnualSavingsUsd(assumptions)
    : Math.max(0, Number(body.estimated_annual_savings ?? 0) || 0)

  const estimatedHoursWeekly = assumptions
    ? Math.round(computeWeeklyHoursSaved(assumptions))
    : Math.max(0, Math.round(Number(body.estimated_hours_saved_weekly ?? 0) || 0))

  const rows = await sql<Array<{ id: string }>>`
    insert into opportunities (
      assessment_id, client_id, title, description, department, complexity,
      estimated_hours_saved_weekly, estimated_annual_savings, priority,
      implementation_timeline, status, notes, source, pain_points, decision_makers,
      why_relevant, relevance_score, confidence_score, savings_assumptions,
      business_problem, proposed_solution, details, publication_status
    ) values (
      ${assessmentId}, ${client.id}, ${title}, ${body.description?.trim() || null}, ${primaryDepartment(body.department)}, ${normalizeComplexity(body.complexity)},
      ${estimatedHoursWeekly}, ${estimatedAnnualSavings}, ${normalizePriority(body.priority)},
      ${normalizeTimeline(body.timeline)}, ${normalizeStatus(body.status || "identified")}, ${body.notes?.trim() || null}, 'manual', ${sql.json([])}, ${sql.json([])},
      ${body.why_relevant?.trim() || null}, null, null, ${sql.json(assumptions ?? {})},
      ${body.business_problem?.trim() || null}, ${body.proposed_solution?.trim() || null}, ${sql.json({})}, 'draft'
    )
    returning id
  `

  return { id: rows[0]!.id }
}

/** Update content or publication state without changing the opportunity source. */
export async function updateOpportunityForClient(
  clientId: string,
  opportunityId: string,
  body: UpdateOpportunityInput,
  adminId: string,
): Promise<boolean> {
  const rows = await sql<
    Array<{
      title: string
      description: string | null
      department: string | null
      priority: string
      complexity: string
      implementation_timeline: string | null
      status: string
      notes: string | null
      pain_points: unknown
      decision_makers: unknown
      why_relevant: string | null
      relevance_score: number | null
      confidence_score: number | null
      savings_assumptions: unknown
      estimated_annual_savings: number | string | null
      estimated_hours_saved_weekly: number | string | null
      business_problem: string | null
      proposed_solution: string | null
      details: unknown
      publication_status: PublicationStatus
      company_size: string | null
    }>
  >`
    select o.*, c.company_size
    from opportunities o
    join clients c on c.id = o.client_id
    where o.id = ${opportunityId}::uuid
      and o.client_id = ${clientId}::uuid
    limit 1
  `
  const existing = rows[0]
  if (!existing) return false

  const title = body.title !== undefined ? body.title.trim() : existing.title
  if (title.length < 3) {
    throw new OpportunityServiceError(400, "Title must contain at least 3 characters")
  }

  const existingAssumptions = parseSavingsAssumptions(existing.savings_assumptions)
  const requestedAssumptions =
    body.savings_assumptions !== undefined
      ? parseSavingsAssumptions(body.savings_assumptions)
      : existingAssumptions
  const assumptions = requestedAssumptions
    ? clampAssumptionsForCompany(requestedAssumptions, existing.company_size)
    : null

  const annualSavings =
    body.savings_assumptions !== undefined && assumptions
      ? computeAnnualSavingsUsd(assumptions)
      : body.estimated_annual_savings !== undefined
        ? nonNegativeNumber(body.estimated_annual_savings)
        : nonNegativeNumber(existing.estimated_annual_savings)
  const weeklyHours =
    body.savings_assumptions !== undefined && assumptions
      ? computeWeeklyHoursSaved(assumptions)
      : body.estimated_hours_saved_weekly !== undefined
        ? nonNegativeNumber(body.estimated_hours_saved_weekly)
        : nonNegativeNumber(existing.estimated_hours_saved_weekly)

  const publicationStatus = body.publication_status ?? existing.publication_status
  if (publicationStatus !== "draft" && publicationStatus !== "published") {
    throw new OpportunityServiceError(400, "Invalid publication status")
  }

  const details =
    body.details !== undefined
      ? normalizeOpportunityDetails(body.details)
      : normalizeOpportunityDetails(existing.details)

  const updated = await sql<Array<{ id: string }>>`
    update opportunities
    set
      title = ${title},
      description = ${body.description !== undefined ? body.description.trim() || null : existing.description},
      department = ${body.department !== undefined ? primaryDepartment(body.department) : existing.department},
      priority = ${body.priority !== undefined ? normalizePriority(body.priority) : existing.priority},
      complexity = ${body.complexity !== undefined ? normalizeComplexity(body.complexity) : existing.complexity},
      implementation_timeline = ${
        body.timeline !== undefined ? normalizeTimeline(body.timeline) : existing.implementation_timeline
      },
      status = ${body.status !== undefined ? normalizeStatus(body.status) : existing.status},
      notes = ${body.notes !== undefined ? body.notes.trim() || null : existing.notes},
      pain_points = ${sql.json(
        body.pain_points !== undefined
          ? normalizeStringArray(body.pain_points, 12)
          : normalizeStringArray(existing.pain_points, 12),
      )},
      decision_makers = ${sql.json(
        body.decision_makers !== undefined
          ? normalizeStringArray(body.decision_makers, 12)
          : normalizeStringArray(existing.decision_makers, 12),
      )},
      why_relevant = ${
        body.why_relevant !== undefined ? body.why_relevant.trim() || null : existing.why_relevant
      },
      relevance_score = ${
        body.relevance_score !== undefined
          ? nullableScore(body.relevance_score)
          : existing.relevance_score
      },
      confidence_score = ${
        body.confidence_score !== undefined
          ? nullableScore(body.confidence_score)
          : existing.confidence_score
      },
      savings_assumptions = ${sql.json(assumptions ?? {})},
      estimated_annual_savings = ${annualSavings},
      estimated_hours_saved_weekly = ${weeklyHours},
      business_problem = ${
        body.business_problem !== undefined
          ? body.business_problem.trim() || null
          : existing.business_problem
      },
      proposed_solution = ${
        body.proposed_solution !== undefined
          ? body.proposed_solution.trim() || null
          : existing.proposed_solution
      },
      details = ${sql.json(details)},
      publication_status = ${publicationStatus},
      published_at = ${
        publicationStatus === "published"
          ? sql`case when publication_status = 'published' then published_at else now() end`
          : null
      },
      published_by = ${
        publicationStatus === "published"
          ? sql`case when publication_status = 'published' then published_by else ${adminId}::uuid end`
          : null
      },
      updated_at = now()
    where id = ${opportunityId}::uuid
      and client_id = ${clientId}::uuid
    returning id
  `

  return Boolean(updated[0])
}

/** Delete a single opportunity that belongs to the given client. */
export async function deleteOpportunityForClient(
  clientId: string,
  opportunityId: string,
): Promise<boolean> {
  const rows = await sql<Array<{ id: string }>>`
    delete from opportunities
    where id = ${opportunityId}::uuid and client_id = ${clientId}::uuid
    returning id
  `
  return Boolean(rows[0])
}

function parseSavingsAssumptions(value: unknown): SavingsAssumptions | null {
  if (!value || typeof value !== "object") return null
  const row = value as Partial<SavingsAssumptions>
  const parsed = {
    affected_headcount: Number(row.affected_headcount),
    hours_per_person_per_week: Number(row.hours_per_person_per_week),
    blended_hourly_rate_usd: Number(row.blended_hourly_rate_usd),
    efficiency: Number(row.efficiency),
  }
  return Object.values(parsed).every(Number.isFinite) ? parsed : null
}

function normalizeOpportunityDetails(value: unknown): OpportunityDetails {
  if (!value || typeof value !== "object") return {}
  const row = value as OpportunityDetails
  return {
    expected_roi: typeof row.expected_roi === "string" ? row.expected_roi.trim() : undefined,
    savings_confidence:
      typeof row.savings_confidence === "string" ? row.savings_confidence.trim() : undefined,
    capabilities: normalizeStringArray(row.capabilities, 15),
    integrations: normalizeStringArray(row.integrations, 15),
    evidence: normalizeStringArray(row.evidence, 15),
  }
}

function normalizeStringArray(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return []
  return Array.from(
    new Set(value.map((item) => String(item ?? "").trim()).filter(Boolean)),
  ).slice(0, max)
}

function nonNegativeNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

function nullableScore(value: unknown): number | null {
  if (value === null || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : null
}

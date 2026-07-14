import { generateObject, generateText } from "ai"
import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/session"
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

async function runCompanyIntelligence(input: {
  companyName: string
  website: string | null
  industry: string | null
  companySize: string | null
  overallScore: number
  readinessLevel: string
  dimensionScores: unknown
  assessmentAnswerHighlights: string[]
  workforce: Array<{ role_title: string; department: string | null; employee_count: number }>
}) {
  const userPrompt = buildCompanyIntelligenceUserPrompt({
    companyName: input.companyName,
    website: input.website,
    industry: input.industry,
    companySize: input.companySize,
    overallScore: input.overallScore,
    readinessLevel: input.readinessLevel,
    dimensionScores: input.dimensionScores,
    assessmentAnswerHighlights: input.assessmentAnswerHighlights,
    workforce: input.workforce,
  })

  // Stage 1a — research with Google Search grounded tool
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

  // Stage 1b — coerce into schema (no web search)
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

  // Ensure assessment context is always present for Stage 2 (portal data wins)
  return {
    ...intelligence,
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

export async function POST() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isGoogleAiConfigured()) {
      return NextResponse.json(
        { error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured" },
        { status: 500 },
      )
    }

    const clients = await sql<
      Array<{
        id: string
        company_name: string
        industry: string | null
        company_size: string | null
      }>
    >`
      select id, company_name, industry, company_size
      from clients
      where user_id = ${user.id}
      limit 1
    `
    const client = clients[0]
    if (!client) {
      return NextResponse.json({ error: "Client profile not found" }, { status: 404 })
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
      return NextResponse.json({ error: "Assessment required before generating opportunities" }, { status: 400 })
    }

    const workforce = await sql<
      Array<{
        role_title: string
        department: string | null
        employee_count: number
      }>
    >`
      select role_title, department, employee_count
      from workforce_roles
      where client_id = ${client.id}
      order by employee_count desc
      limit 50
    `

    const assessmentAnswerHighlights = buildAssessmentAnswerHighlights(latestAssessment.answers)
    const website = extractWebsiteCandidate(latestAssessment.company_info, client.company_name)

    const intelligence = await runCompanyIntelligence({
      companyName: client.company_name,
      website,
      industry: client.industry,
      companySize: client.company_size,
      overallScore: latestAssessment.overall_score,
      readinessLevel: latestAssessment.readiness_level,
      dimensionScores: latestAssessment.dimension_scores,
      assessmentAnswerHighlights,
      workforce,
    })

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

    // Stage 2 — Opportunity Generator (profile only, no web search)
    const { object: batch } = await generateObject({
      model: getLlmModel(),
      schema: OpportunityBatchSchema,
      system: OPPORTUNITY_GENERATOR_SYSTEM,
      prompt: buildOpportunityGeneratorUserPrompt(intelligence),
      temperature: 0.6,
    })

    const processed = postprocessOpportunities(batch.opportunities, client.company_size)

    if (processed.length === 0) {
      return NextResponse.json(
        { error: "No opportunities passed relevance threshold (≥50). Try again or enrich company profile." },
        { status: 502 },
      )
    }

    await sql`
      delete from opportunities
      where client_id = ${client.id}
        and source in ('ai', 'assessment')
    `

    for (const opp of processed) {
      await sql`
        insert into opportunities (
          assessment_id,
          client_id,
          title,
          description,
          department,
          complexity,
          estimated_hours_saved_weekly,
          estimated_annual_savings,
          priority,
          implementation_timeline,
          status,
          notes,
          source,
          pain_points,
          decision_makers,
          why_relevant,
          relevance_score,
          confidence_score,
          savings_assumptions,
          business_problem,
          proposed_solution,
          details
        ) values (
          ${latestAssessment.id},
          ${client.id},
          ${opp.title},
          ${opp.description},
          ${opp.department},
          ${opp.complexity},
          ${opp.estimated_hours_saved_weekly},
          ${opp.estimated_annual_savings},
          ${opp.priority},
          ${opp.implementation_timeline},
          ${opp.status},
          ${opp.notes},
          ${opp.source},
          ${sql.json(opp.pain_points)},
          ${sql.json(opp.decision_makers)},
          ${opp.why_relevant},
          ${opp.relevance_score},
          ${opp.confidence_score},
          ${sql.json(opp.savings_assumptions)},
          ${opp.business_problem},
          ${opp.proposed_solution},
          ${sql.json(opp.details)}
        )
      `
    }

    return NextResponse.json({
      success: true,
      count: processed.length,
      intelligenceStored: true,
      webResearchUsed: true,
    })
  } catch (error) {
    console.error("opportunities generation error", error)
    const message = error instanceof Error ? error.message : "Failed to generate opportunities"
    const missingRelation =
      typeof message === "string" &&
      (message.includes("company_intelligence") ||
        message.includes("savings_assumptions") ||
        message.includes("source") ||
        message.includes("details"))
    return NextResponse.json(
      {
        error: missingRelation
          ? "Database schema is missing opportunity columns. Run scripts/012 and 013 SQL migrations."
          : "Failed to generate opportunities",
      },
      { status: 500 },
    )
  }
}

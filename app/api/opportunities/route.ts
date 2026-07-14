import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/session"
import { sql } from "@/lib/db"
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
  type SavingsAssumptions,
} from "@/lib/opportunities/savings"

async function getClientByUser(userId: string) {
  const rows = await sql<Array<{ id: string; company_size: string | null }>>`
    select id, company_size from clients where user_id = ${userId} limit 1
  `
  return rows[0] ?? null
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await getClientByUser(user.id)
    if (!client) return NextResponse.json({ error: "Client profile not found" }, { status: 404 })

    const body = (await request.json()) as {
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

    const title = body.title?.trim()
    if (!title || title.length < 3) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const assessments = await sql<Array<{ id: string }>>`
      select id from assessments
      where client_id = ${client.id}
      order by created_at desc
      limit 1
    `
    const assessmentId = assessments[0]?.id ?? null

    const rawAssumptions: SavingsAssumptions | null =
      body.savings_assumptions &&
      Number.isFinite(Number(body.savings_assumptions.affected_headcount)) &&
      Number.isFinite(Number(body.savings_assumptions.hours_per_person_per_week)) &&
      Number.isFinite(Number(body.savings_assumptions.blended_hourly_rate_usd)) &&
      Number.isFinite(Number(body.savings_assumptions.efficiency))
        ? {
            affected_headcount: Number(body.savings_assumptions.affected_headcount),
            hours_per_person_per_week: Number(body.savings_assumptions.hours_per_person_per_week),
            blended_hourly_rate_usd: Number(body.savings_assumptions.blended_hourly_rate_usd),
            efficiency: Number(body.savings_assumptions.efficiency),
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
        ${assessmentId},
        ${client.id},
        ${title},
        ${body.description?.trim() || null},
        ${primaryDepartment(body.department)},
        ${normalizeComplexity(body.complexity)},
        ${estimatedHoursWeekly},
        ${estimatedAnnualSavings},
        ${normalizePriority(body.priority)},
        ${normalizeTimeline(body.timeline)},
        ${normalizeStatus(body.status || "identified")},
        ${body.notes?.trim() || null},
        'manual',
        ${sql.json([])},
        ${sql.json([])},
        ${body.why_relevant?.trim() || null},
        null,
        null,
        ${sql.json(assumptions ?? {})},
        ${body.business_problem?.trim() || null},
        ${body.proposed_solution?.trim() || null},
        ${sql.json({})}
      )
      returning id
    `

    return NextResponse.json({ success: true, id: rows[0]?.id })
  } catch (error) {
    console.error("opportunities POST error", error)
    return NextResponse.json({ error: "Failed to create opportunity" }, { status: 500 })
  }
}

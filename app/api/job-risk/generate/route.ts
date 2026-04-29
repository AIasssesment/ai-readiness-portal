import { generateObject } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { z } from "zod"
import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/session"
import { sql } from "@/lib/db"

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const RoleSchema = z.object({
  role_name: z.string().min(2),
  department: z.enum(["Sales", "Operations", "Finance", "Customer Support", "Marketing", "IT", "HR", "Legal"]),
  risk_score: z.number().min(1).max(5),
  timeline_months_min: z.number().int().min(3).max(60),
  timeline_months_max: z.number().int().min(6).max(72),
  tasks_at_risk: z.array(z.string()).min(2).max(6),
  tasks_safe: z.array(z.string()).min(2).max(6),
  reskilling_suggestions: z.array(z.string()).min(2).max(6),
  reasoning: z.string().min(10),
})

const ReportSchema = z.object({
  overall_risk_score: z.number().min(1).max(5),
  executive_summary: z.string().min(20),
  roles: z.array(RoleSchema).min(8).max(12),
})

export async function POST() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clients = await sql<Array<{ id: string; company_name: string; industry: string | null; company_size: string | null }>>`
      select id, company_name, industry, company_size
      from clients
      where user_id = ${user.id}
      limit 1
    `
    const client = clients[0]
    if (!client) {
      return NextResponse.json({ error: "Client profile not found" }, { status: 404 })
    }

    const latestAssessments = await sql<Array<{ id: string; overall_score: number; readiness_level: string; dimension_scores: Record<string, number> | null }>>`
      select id, overall_score, readiness_level, dimension_scores
      from assessments
      where client_id = ${client.id}
      order by created_at desc
      limit 1
    `
    const latestAssessment = latestAssessments[0]
    if (!latestAssessment) {
      return NextResponse.json({ error: "Assessment required before generating job risk" }, { status: 400 })
    }

    const systemPrompt = `You are an expert AI disruption analyst. Generate a realistic, defensible per-role AI disruption risk report for a specific company.

Rules:
- Use real job titles common in the given industry, not made-up ones.
- For each role, pick a SPECIFIC department (Sales, Operations, Finance, Customer Support, Marketing, IT, HR, Legal).
- Risk score 1-5 with a meaningful spread.
- Timelines must be realistic: routine clerical work -> 6-18 months; relationship-heavy work -> 24-60 months.
- Tasks at risk must be concrete.
- Reskilling suggestions must be specific and achievable in 3-12 months.
- overall_risk_score should be a weighted average reflecting company mix.`

    const userPrompt = `Company: ${client.company_name}
Industry: ${client.industry || "N/A"}
Company size: ${client.company_size || "N/A"} employees
Latest AI Maturity Score: ${latestAssessment.overall_score}/100 (${latestAssessment.readiness_level})
Dimension scores: ${JSON.stringify(latestAssessment.dimension_scores || {})}

Generate a Job Risk Report with 8-12 roles likely to exist at this company.`

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: ReportSchema,
      system: systemPrompt,
      prompt: userPrompt,
    })

    const reportRows = await sql<Array<{ id: string }>>`
      insert into job_risk_reports (client_id, assessment_id, overall_risk_score, executive_summary, generated_at)
      values (${client.id}, ${latestAssessment.id}, ${object.overall_risk_score}, ${object.executive_summary}, now())
      returning id
    `
    const report = reportRows[0]

    const roleRows = object.roles.map((role) => ({
      report_id: report.id,
      role_name: role.role_name,
      department: role.department,
      risk_score: role.risk_score,
      timeline_months_min: role.timeline_months_min,
      timeline_months_max: role.timeline_months_max,
      tasks_at_risk: JSON.stringify(role.tasks_at_risk),
      tasks_safe: JSON.stringify(role.tasks_safe),
      reskilling_suggestions: JSON.stringify(role.reskilling_suggestions),
      reasoning: role.reasoning,
    }))

    await sql`
      insert into job_risks ${sql(roleRows)}
    `

    return NextResponse.json({ success: true, reportId: report.id })
  } catch (error) {
    console.error("job risk generation error", error)
    return NextResponse.json({ error: "Failed to generate job risk report" }, { status: 500 })
  }
}

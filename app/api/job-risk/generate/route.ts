import { generateObject } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { z } from "zod"
import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/session"
import { sql } from "@/lib/db"
import { apiErrors } from "@/lib/http/api-errors"

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const RoleSchema = z.object({
  role_name: z.string().min(2),
  department: z.string().nullable(),
  timeline_months_min: z.number().int().min(3).max(60),
  timeline_months_max: z.number().int().min(6).max(72),
  tasks_at_risk: z.array(z.string()).min(2).max(6),
  tasks_safe: z.array(z.string()).min(2).max(6),
  reskilling_suggestions: z.array(z.string()).min(2).max(6),
  reasoning: z.string().min(10),
})

const ReportSchema = z.object({
  executive_summary: z.string().min(20),
  roles: z.array(RoleSchema).min(1).max(50),
})

type WorkforceRole = {
  role_title: string
  normalized_role: string
  department: string | null
  employee_count: number
}

type BenchmarkRow = {
  normalized_role: string
  risk_score_0_1: number
  source: string
}

function fallbackRiskByDepartment(department: string | null) {
  const value = (department || "").toLowerCase()
  if (value.includes("finance")) return 0.72
  if (value.includes("support")) return 0.76
  if (value.includes("operations")) return 0.68
  if (value.includes("marketing")) return 0.58
  if (value.includes("sales")) return 0.56
  if (value.includes("hr")) return 0.47
  if (value.includes("it")) return 0.43
  return 0.55
}

export async function POST() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return apiErrors.unauthorized()
    }

    const clients = await sql<Array<{ id: string; company_name: string; industry: string | null; company_size: string | null }>>`
      select id, company_name, industry, company_size
      from clients
      where user_id = ${user.id}
      limit 1
    `
    const client = clients[0]
    if (!client) {
      return apiErrors.notFound("Client profile not found")
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
      return apiErrors.badRequest("Assessment required before generating job risk")
    }

    const workforceRoles = await sql<WorkforceRole[]>`
      select role_title, normalized_role, department, employee_count
      from workforce_roles
      where client_id = ${client.id}
      order by employee_count desc
      limit 50
    `

    if (!workforceRoles.length) {
      return apiErrors.badRequest(
        "Workforce roles are required. Add job titles and employee counts before generating job risk.",
      )
    }

    const benchmarks = await sql<BenchmarkRow[]>`
      select normalized_role, risk_score_0_1, source
      from external_role_risk_benchmarks
    `

    const benchmarkMap = new Map(benchmarks.map((row) => [row.normalized_role, row]))
    const workforceWithRisk = workforceRoles.map((role) => {
      const benchmark = benchmarkMap.get(role.normalized_role)
      const benchmarkScore = benchmark?.risk_score_0_1 ?? fallbackRiskByDepartment(role.department)
      const atRiskHeadcount = Number((role.employee_count * benchmarkScore).toFixed(2))
      return {
        ...role,
        benchmark_score: benchmarkScore,
        at_risk_headcount: atRiskHeadcount,
        risk_score_1_5: Number((benchmarkScore * 5).toFixed(2)),
        risk_data_source: benchmark?.source || "department-fallback",
      }
    })

    const totalHeadcount = workforceWithRisk.reduce((sum, role) => sum + role.employee_count, 0)
    const weightedRisk01 =
      totalHeadcount > 0
        ? workforceWithRisk.reduce((sum, role) => sum + role.employee_count * role.benchmark_score, 0) / totalHeadcount
        : 0
    const overallRiskScore = Number((weightedRisk01 * 5).toFixed(2))
    const totalAtRiskHeadcount = Number(
      workforceWithRisk.reduce((sum, role) => sum + role.at_risk_headcount, 0).toFixed(2),
    )

    const systemPrompt = `You are an expert AI disruption analyst. Generate realistic role insights for a company workforce risk report.

Rules:
- Keep role names exactly as provided.
- Use department exactly as provided (or null if missing).
- Do not invent employee counts.
- Tasks at risk must be concrete and role-specific.
- Tasks safe must focus on relationship, judgment, and strategic work.
- Reskilling suggestions must be practical and achievable in 3-12 months.
- Timeline must be realistic and aligned with the provided risk score.
- Cover every provided role exactly once.`

    const userPrompt = `Company: ${client.company_name}
Industry: ${client.industry || "N/A"}
Company size: ${client.company_size || "N/A"} employees
Latest AI Maturity Score: ${latestAssessment.overall_score}/100 (${latestAssessment.readiness_level})
Dimension scores: ${JSON.stringify(latestAssessment.dimension_scores || {})}

Workforce data (ground truth input):
${JSON.stringify(workforceWithRisk, null, 2)}

Create role-level insights for this exact workforce list and write an executive summary.
Mention the estimated at-risk headcount (${totalAtRiskHeadcount}) in the executive summary.`

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: ReportSchema,
      system: systemPrompt,
      prompt: userPrompt,
    })

    const reportRows = await sql<Array<{ id: string }>>`
      insert into job_risk_reports (client_id, assessment_id, overall_risk_score, executive_summary, generated_at)
      values (${client.id}, ${latestAssessment.id}, ${overallRiskScore}, ${object.executive_summary}, now())
      returning id
    `
    const report = reportRows[0]

    const insightsByRole = new Map(object.roles.map((role) => [role.role_name.toLowerCase(), role]))
    const roleRows = workforceWithRisk.map((role) => {
      const insight = insightsByRole.get(role.role_title.toLowerCase())
      return {
      report_id: report.id,
      role_name: role.role_title,
      department: role.department,
      risk_score: role.risk_score_1_5,
      benchmark_risk_score: role.benchmark_score,
      risk_data_source: role.risk_data_source,
      employee_count: role.employee_count,
      at_risk_headcount: role.at_risk_headcount,
      timeline_months_min: insight?.timeline_months_min ?? 6,
      timeline_months_max: insight?.timeline_months_max ?? 18,
      tasks_at_risk: JSON.stringify(insight?.tasks_at_risk ?? []),
      tasks_safe: JSON.stringify(insight?.tasks_safe ?? []),
      reskilling_suggestions: JSON.stringify(insight?.reskilling_suggestions ?? []),
      reasoning: insight?.reasoning ?? "Risk estimate is based on external automation benchmark and role profile.",
      }
    })

    await sql`
      insert into job_risks ${sql(roleRows)}
    `

    return NextResponse.json({
      success: true,
      reportId: report.id,
      summary: {
        totalHeadcount,
        totalAtRiskHeadcount,
        overallRiskScore,
      },
    })
  } catch (error) {
    console.error("job risk generation error", error)
    return apiErrors.internal("Failed to generate job risk report")
  }
}

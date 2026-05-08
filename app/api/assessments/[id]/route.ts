import { createClient } from "@/lib/db-client/server"
import { NextResponse } from "next/server"
import { apiErrors } from "@/lib/http/api-errors"
import { dbAssessmentRowToResults } from "@/lib/assessment/db-assessment-to-results"

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const db = await createClient()
    const {
      data: { user },
    } = await db.auth.getUser()

    if (!user) {
      return apiErrors.unauthorized()
    }

    const { data: client } = await db.from("clients").select("id").eq("user_id", user.id).single()
    const clientId = (client as { id?: string } | null)?.id
    if (!clientId) {
      return apiErrors.notFound()
    }

    const { data: row, error } = await db
      .from("assessments")
      .select()
      .eq("id", id)
      .eq("client_id", clientId)
      .single()

    if (error || !row) {
      return apiErrors.notFound()
    }

    const r = row as Record<string, unknown>
    const results = dbAssessmentRowToResults(r, clientId)

    return NextResponse.json({
      assessment: {
        id: String(r.id),
        clientId,
        overallScore: results.overallScore,
        readinessLevel: String(r.readiness_level ?? "emerging"),
        tier: results.tier,
        dimensionScores: results.dimensionScores,
        answers: results.answers,
        companyInfo: results.companyInfo,
      },
    })
  } catch (error) {
    console.error("GET /api/assessments/[id]:", error)
    return apiErrors.internal("Internal server error")
  }
}

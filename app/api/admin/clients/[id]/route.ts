import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/admin"
import { apiErrors } from "@/lib/http/api-errors"
import { backendFetch } from "@/lib/api/backend"
import { backendErrorResponse } from "@/lib/api/backend-route"
import { EMPLOYEE_RANGES, INDUSTRIES } from "@/lib/assessment-data"
import { ApiClientError } from "@/lib/api/client"

const INDUSTRY_SET = new Set(INDUSTRIES)
const SIZE_SET = new Set(EMPLOYEE_RANGES)

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin()
  if (!admin) return apiErrors.forbidden()

  const { id } = await params

  let body: { industry?: string | null; company_size?: string | null; companySize?: string | null }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return apiErrors.badRequest("Invalid JSON body")
  }

  const hasIndustry = "industry" in body
  const hasSize = "company_size" in body || "companySize" in body
  if (!hasIndustry && !hasSize) {
    return apiErrors.badRequest("Nothing to update")
  }

  const industry = body.industry?.trim() || null
  const companySize = (body.company_size ?? body.companySize)?.trim() || null

  if (hasIndustry && industry && !INDUSTRY_SET.has(industry)) {
    return apiErrors.badRequest("Invalid industry")
  }
  if (hasSize && companySize && !SIZE_SET.has(companySize)) {
    return apiErrors.badRequest("Invalid company size")
  }

  try {
    await backendFetch(`/clients/${id}`, {
      method: "PATCH",
      clientId: id,
      userId: admin.id,
      userRole: "admin",
      body: JSON.stringify({
        ...(hasIndustry ? { industry } : {}),
        ...(hasSize ? { companySize } : {}),
      }),
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      return apiErrors.notFound("Company not found")
    }
    return backendErrorResponse(error, "Failed to update company")
  }
}

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/admin"
import { apiErrors } from "@/lib/http/api-errors"
import { sql } from "@/lib/db"
import { EMPLOYEE_RANGES, INDUSTRIES } from "@/lib/assessment-data"

const INDUSTRY_SET = new Set(INDUSTRIES)
const SIZE_SET = new Set(EMPLOYEE_RANGES)

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin()
  if (!admin) return apiErrors.forbidden()

  const { id } = await params

  let body: { industry?: string | null; company_size?: string | null }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return apiErrors.badRequest("Invalid JSON body")
  }

  const hasIndustry = "industry" in body
  const hasSize = "company_size" in body
  if (!hasIndustry && !hasSize) {
    return apiErrors.badRequest("Nothing to update")
  }

  const industry = body.industry?.trim() || null
  const companySize = body.company_size?.trim() || null

  if (hasIndustry && industry && !INDUSTRY_SET.has(industry)) {
    return apiErrors.badRequest("Invalid industry")
  }
  if (hasSize && companySize && !SIZE_SET.has(companySize)) {
    return apiErrors.badRequest("Invalid company size")
  }

  const updated = await sql<Array<{ id: string }>>`
    update clients
    set
      industry = ${hasIndustry ? industry : sql`industry`},
      company_size = ${hasSize ? companySize : sql`company_size`},
      updated_at = now()
    where id = ${id}::uuid
    returning id
  `

  if (!updated[0]) {
    return apiErrors.notFound("Company not found")
  }

  return NextResponse.json({ ok: true })
}

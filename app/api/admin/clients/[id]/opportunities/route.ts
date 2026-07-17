import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/admin"
import { apiErrors } from "@/lib/http/api-errors"
import {
  OpportunityServiceError,
  createManualOpportunity,
  type ManualOpportunityInput,
} from "@/lib/opportunities/service"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin()
  if (!admin) return apiErrors.forbidden()

  const { id } = await params

  try {
    const body = (await request.json()) as ManualOpportunityInput
    const created = await createManualOpportunity(id, body)
    return NextResponse.json({ success: true, id: created.id })
  } catch (error) {
    if (error instanceof OpportunityServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("admin manual opportunity error", error)
    return NextResponse.json({ error: "Failed to create opportunity" }, { status: 500 })
  }
}

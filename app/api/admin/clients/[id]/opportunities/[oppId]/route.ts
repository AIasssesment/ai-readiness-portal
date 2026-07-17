import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/admin"
import { apiErrors } from "@/lib/http/api-errors"
import {
  deleteOpportunityForClient,
  OpportunityServiceError,
  updateOpportunityForClient,
  type UpdateOpportunityInput,
} from "@/lib/opportunities/service"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; oppId: string }> },
) {
  const admin = await requireAdmin()
  if (!admin) return apiErrors.forbidden()

  const { id, oppId } = await params

  try {
    const body = (await request.json()) as UpdateOpportunityInput
    const updated = await updateOpportunityForClient(id, oppId, body, admin.id)
    if (!updated) return apiErrors.notFound("Opportunity not found")
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof OpportunityServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("admin opportunity update error", error)
    return NextResponse.json({ error: "Failed to update opportunity" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; oppId: string }> },
) {
  const admin = await requireAdmin()
  if (!admin) return apiErrors.forbidden()

  const { id, oppId } = await params
  const deleted = await deleteOpportunityForClient(id, oppId)
  if (!deleted) return apiErrors.notFound("Opportunity not found")

  return NextResponse.json({ ok: true })
}
